import { PAGINATE_LIMIT } from "consts";
import { DurationMS, ErrorMessage, Flag, HttpRequest, ServerInfo } from "enums";
import {
  forwardResponse,
  handleAPIError,
  handleBadRequest,
  handleRequest,
} from "lib/middlewares";
import { MongoConnection, RedisConnection, ServerError } from "lib/server";
import { isEmpty } from "lodash";
import { ClientSession } from "mongoose";
import type { NextApiRequest, NextApiResponse } from "next";
import { IPostReq, IResponse } from "types";
import {
  castAsBoolean,
  processPostsWithoutUser,
  processPostWithoutUser,
  processPostWithUser,
} from "utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case HttpRequest.GET:
      res.setHeader(
        "Cache-Control",
        `maxage=${DurationMS.MIN}, must-revalidate`
      );
      return handleGet(req, res);
    case HttpRequest.POST:
      return handleRequest(req, res, createDoc);
    case HttpRequest.PATCH:
      return handleRequest(req, res, patchDoc);
    case HttpRequest.DELETE:
      return handleRequest(req, res, deleteDoc);
    default:
      return handleBadRequest(res);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const reqQuery = req.query as Partial<IPostReq>;
  await (reqQuery?.limit > 1 ? getPosts(reqQuery) : getPost(reqQuery))
    .then((payload) => forwardResponse(res, payload))
    .catch((err) => handleAPIError(res, err));
}

async function getPosts(params: Partial<IPostReq>): Promise<IResponse> {
  const {
    username,
    isPrivate: _isPrivate,
    createdAt = "",
    limit = PAGINATE_LIMIT,
  } = params;
  const isPrivate = castAsBoolean(_isPrivate);

  return new Promise(async (resolve, reject) => {
    const client = new RedisConnection();
    let { data: posts, ETag } = await client.read(
      username,
      isPrivate,
      createdAt,
      limit
    );
    if (posts?.length) {
      client.close();
      resolve({
        status: 200,
        message: ServerInfo.POST_RETRIEVED_CACHED,
        data: { posts },
        ETag,
      });
    } else {
      const query: any = createdAt ? { createdAt: { $lt: createdAt } } : {};
      if (username) query.username = username;
      if (!isPrivate) query.isPrivate = false;
      const { Post } = await MongoConnection();
      await Post.find(query)
        .select(["-user"])
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .then((_posts) => {
          if (_posts?.length) {
            posts = processPostsWithoutUser(_posts);
            client.write(posts, username, isPrivate, createdAt, limit);
          }
          resolve({
            status: 200,
            message: posts?.length
              ? ServerInfo.POST_RETRIEVED
              : ServerInfo.POST_NA,
            data: { posts },
            ETag,
          });
        })
        .catch((err) => reject(new ServerError(500, err?.message)))
        .finally(client.close);
    }
  });
}

async function getPost(params: Partial<IPostReq>): Promise<IResponse> {
  return new Promise(async (resolve, reject) => {
    const { id, username, slug } = params;
    if (!id && !username && !slug) reject(new ServerError(400));
    else {
      try {
        const { Post } = await MongoConnection();
        await (id ? Post.findById(id) : Post.findOne({ username, slug }))
          .select(["-user"])
          .lean()
          .then((_post) => {
            if (isEmpty(_post)) {
              reject(new ServerError(400, ServerInfo.POST_NA));
            } else {
              const post = processPostWithoutUser(_post);
              resolve({
                status: 200,
                message: ServerInfo.POST_RETRIEVED,
                data: { post },
                ETag: post.id + post.updatedAt,
              });
            }
          });
      } catch (err) {
        reject(new ServerError(500, err?.message));
      }
    }
  });
}

async function createDoc(req: NextApiRequest): Promise<IResponse> {
  return new Promise(async (resolve, reject) => {
    let session: ClientSession = null;
    try {
      const { Post, User, mongoConnection } = await MongoConnection();
      session = await mongoConnection.startSession();
      await session.withTransaction(async () => {
        const userId = req.headers["user-id"];
        const post: Partial<IPostReq> = req.body;
        const { isPrivate: _isPrivate, slug } = post;
        const isPrivate = castAsBoolean(_isPrivate);
        await Post.exists({ slug, user: userId }).then((exists) => {
          if (exists) {
            throw new ServerError(200, ErrorMessage.POST_SLUG_USED);
          } else {
            const newPost = new Post({
              ...post,
              isPrivate,
              user: userId,
            });
            newPost
              .save()
              .then((res) => {
                if (res.id) {
                  const client = new RedisConnection();
                  client.newPostCreated(newPost, false);
                  User.findByIdAndUpdate(
                    userId,
                    { $push: { posts: { $each: [res.id], $position: 0 } } },
                    { safe: true, upsert: true },
                    function (err) {
                      if (err) {
                        throw new ServerError(500, err?.message);
                      } else {
                        resolve({
                          status: 200,
                          message: ServerInfo.POST_CREATED,
                          data: { post: res },
                        });
                      }
                    }
                  );
                } else {
                  throw new ServerError(500, ErrorMessage.POST_CREATE_FAIL);
                }
              })
              .catch((err) => reject(new ServerError(500, err?.message)));
          }
        });
      });
    } catch (err) {
      reject(new ServerError(500, err?.message));
    } finally {
      session?.endSession();
    }
  });
}

async function patchDoc(req: NextApiRequest): Promise<IResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const { id, ..._set } = req.body as Partial<IPostReq>;
      _set.isPrivate = castAsBoolean(req.body?.isPrivate);
      const { Post } = await MongoConnection();
      const post = await Post.findById(id);
      for (const key of Object.keys(_set)) {
        post[key] = _set[key];
      }
      await post
        .save()
        .then((_post) => {
          const post = processPostWithUser(_post);
          const client = new RedisConnection();
          client.resetCache(post, false);
          resolve({
            status: 200,
            message: ServerInfo.POST_UPDATED,
            data: { post },
          });
        })
        .catch((err) => reject(new ServerError(500, err?.message)));
    } catch (err) {
      reject(new ServerError(500, err?.message));
    }
  });
}

async function deleteDoc(req: NextApiRequest): Promise<IResponse> {
  return new Promise(async (resolve, reject) => {
    let session: ClientSession = null;
    try {
      const { Post, User, mongoConnection } = await MongoConnection();
      session = await mongoConnection.startSession();
      await session.withTransaction(async () => {
        const userId = req.headers["user-id"];
        const {
          id,
          username,
          isPrivate: _isPrivate, // string
        } = req.query as Partial<IPostReq>;
        const isPrivate = castAsBoolean(_isPrivate);
        await Post.findByIdAndDelete(id)
          .then(() => {
            const client = new RedisConnection();
            client.resetCache({ id, username, isPrivate }, false);
            User.findByIdAndUpdate(
              userId,
              { $pullAll: { posts: [id] } },
              { lean: true, new: true },
              function (err, doc) {
                if (err) {
                  throw new ServerError(500, err?.message);
                } else {
                  resolve({ status: 200, message: ServerInfo.POST_DELETED });
                }
              }
            );
          })
          .catch((err) => {
            throw new ServerError(500, err.message);
          });
      });
    } catch (err) {
      reject(new ServerError(500, err?.message));
    } finally {
      session?.endSession();
    }
  });
}
