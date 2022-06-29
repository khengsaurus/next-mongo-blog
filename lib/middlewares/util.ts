import { HttpResponse } from "enums";
import { extend } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { IResponse, IUser } from "types";
import { ServerError } from "../server";
import { validateAuth } from "./auth";

export async function handleRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  callback: (p: NextApiRequest) => Promise<IResponse>
) {
  await validateAuth(req)
    .then(async () => await callback(req))
    .then((payload) => forwardResponse(res, payload))
    .catch((err) => handleAPIError(res, err));
}

export function forwardResponse(res: NextApiResponse, payload: IResponse) {
  const { status, message, data, ETag } = payload;
  if (ETag) {
    res.status(status);
    res.setHeader("ETag", ETag);
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message,
        ...data,
      })
    );
  } else {
    res.status(status).json({
      message,
      ...data,
    });
  }
}

export function handleBadRequest(res: NextApiResponse, err?: Error) {
  return Promise.resolve().then(() => {
    err && console.info(err?.message);
    res.status(400).json({ message: HttpResponse._400 });
  });
}

export function handleAPIError(res: NextApiResponse, err?: ServerError) {
  err && console.info(err.status + " : " + err.message);
  res.status(err.status).json({ message: err.message });
  return;
}

export function errorHandler(
  err: Error,
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (err.message) {
    case HttpResponse._500:
      console.info(err.message);
      console.info("Request URL: " + req.url);
      console.info("Query: " + JSON.stringify(req.query));
      console.info("Body: " + JSON.stringify(req.body));
      forwardResponse(res, { status: 500, message: HttpResponse._500 });
      break;
    case HttpResponse._400:
      forwardResponse(res, { status: 400, message: HttpResponse._400 });
  }
}

export function processUserData(user: any, id: string): Partial<IUser> {
  const posts = [];
  if (user.posts?.length > 0) {
    try {
      user.posts.forEach(({ slug, _id }) => {
        posts.push(new Object({ slug, id: _id.toString() }));
      });
    } catch (err) {
      console.info("Failed to parse user data: " + err.message);
    }
  }
  return {
    id,
    username: user.username,
    email: user.email,
    avatarKey: user.avatarKey || "",
    bio: user.bio || "",
    posts: posts,
  };
}

export function createUserObject(params: Object) {
  const baseUser = {
    avatar: "",
    bio: "",
    email: "",
    password: "",
    username: "",
    posts: [],
  };
  return extend(baseUser, params);
}
