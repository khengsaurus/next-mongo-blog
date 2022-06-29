import { DEFAULT_EXPIRE, PAGINATE_LIMIT } from "consts";
import { Flag, ServerInfo } from "enums";
import { createClient, RedisClientType } from "redis";
import { IObject, IPost, IResponse } from "types";
import { setPromiseTimeout } from "utils";

class RedisConnection {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ url: process.env.ENV_REDIS_URL });
    this.connect();
  }

  async connect() {
    return new Promise(async (resolve) => {
      if (this.client?.isOpen) resolve(1);
      else {
        await this.client.connect().then(resolve).catch(console.info);
      }
    });
  }

  close() {
    if (this?.client?.isOpen) this.client.quit().catch(console.info);
  }

  async set(
    value: any,
    queryKey: string,
    queryDateLimit?: string
  ): Promise<any | void> {
    const val = typeof value === "string" ? value : JSON.stringify(value);
    const isHSet = queryDateLimit !== undefined;
    return new Promise(async (resolve) => {
      this.connect()
        .then(() => {
          isHSet
            ? this.client.HSET(queryKey, queryDateLimit, val)
            : this.client.set(queryKey, val);
        })
        .then(() => this.client.expire(queryKey, DEFAULT_EXPIRE))
        .then(resolve)
        .catch((err) => {
          const key = isHSet ? `${queryKey}-${queryDateLimit}` : queryKey;
          console.info(`${ServerInfo.REDIS_SET_FAIL}: ${key}`);
          console.info(`Error: ${err?.message}`);
          resolve(-1);
        });
    });
  }

  _get<T extends any>(
    defaultVal: T,
    queryKey: string,
    queryDateLimit?: string
  ): Promise<T> {
    return new Promise(async (resolve) => {
      const isHGet = queryDateLimit !== undefined;
      this.connect()
        .then(() =>
          isHGet
            ? this.client.HGET(queryKey, queryDateLimit)
            : this.client.get(queryKey)
        )
        .then((val) => {
          if (!val) resolve(defaultVal);
          else {
            this.client.expire(queryKey, DEFAULT_EXPIRE);
            resolve(JSON.parse(val) as T);
          }
        })
        .catch((err) => {
          const key = isHGet ? `${queryKey}-${queryDateLimit}` : queryKey;
          console.info(`${ServerInfo.REDIS_GET_FAIL}: ${key}`);
          console.info(`Error: ${err?.message}`);
          resolve(defaultVal);
        });
    });
  }

  _hgetall(defaultVal: IObject, key: string): Promise<IObject> {
    return new Promise(async (resolve) => {
      this.connect()
        .then(() => this.client.HGETALL(key))
        .then((map) => {
          // for (const key of Object.keys(map)) map[key] = JSON.parse(map[key]);
          this.client.expire(key, DEFAULT_EXPIRE);
          resolve(map);
        })
        .catch((err) => {
          console.info(`${ServerInfo.REDIS_HGETALL_FAIL}: ${key}`);
          console.info(`Error: ${err?.message}`);
          resolve(defaultVal);
        });
    });
  }

  async get<T = any>(
    defaultVal: T,
    queryKey: string,
    queryDateLimit?: string
  ): Promise<T> {
    return setPromiseTimeout<T>(
      () => this._get(defaultVal, queryKey, queryDateLimit),
      defaultVal
    );
  }

  async getMap(key: string): Promise<IObject> {
    return setPromiseTimeout(() => this._hgetall({}, key), null);
  }

  async del(keys: string | string[]): Promise<void> {
    const _keys = typeof keys === "string" ? [keys] : keys;
    if (!_keys?.length) return;
    await this.connect();
    return new Promise((resolve) => {
      try {
        _keys.forEach((key) => this.client.del(key));
      } catch (err) {
        console.info(`${ServerInfo.REDIS_DEL_FAIL}: ${JSON.stringify(_keys)}`);
        console.info(`Error: ${err?.message}`);
      } finally {
        resolve();
      }
    });
  }

  async hdel(queryKey: string, queryDateLimit: string): Promise<number> {
    return new Promise((resolve) => {
      this.client
        .HDEL(queryKey, queryDateLimit)
        .then(resolve)
        .catch((err) => {
          console.info(err?.message);
          resolve(-1);
        });
    });
  }

  async read(
    uN: string,
    pr: boolean,
    date = "",
    limit = PAGINATE_LIMIT
  ): Promise<IResponse<IPost[]>> {
    const { queryKey, queryDateLimit, cacheKey } = this.getKeys(
      uN,
      pr,
      date,
      limit
    );
    return new Promise((resolve) => {
      this.getMap(queryKey).then((pMap) => {
        if (!pMap?.[queryDateLimit]) resolve({ data: [], ETag: cacheKey });
        else
          this.get<IPost[]>([], cacheKey).then((data) =>
            resolve({ data, ETag: cacheKey })
          );
      });
    });
  }

  write(
    posts: IPost[],
    uN: string,
    pr: boolean,
    date = "",
    limit = PAGINATE_LIMIT
  ): Promise<void> {
    if (!posts.length) return;
    return new Promise(async (resolve) => {
      const { queryKey, queryDateLimit, cacheKey } = this.getKeys(
        uN,
        pr,
        date,
        limit
      );
      let postIds = "";
      posts.forEach((post) => (postIds += post.id + "|"));
      this.set(postIds, queryKey, queryDateLimit)
        .then(() => this.set(posts, cacheKey))
        .then(resolve);
    });
  }

  resetCache(post: Partial<IPost>, keepAlive = true): Promise<void> {
    return new Promise((resolve) => {
      const { id, isPrivate, username } = post;
      if (!id) return;
      let prKey; // private Q for user
      let puKey; // public Q for user
      let hKey; // public Q for recent
      prKey = this.getPrimaryKey(username, true);
      puKey = this.getPrimaryKey(username, false);
      hKey = isPrivate ? "" : this.getPrimaryKey("", false);
      let toDelete = [];
      Promise.all([this.getMap(prKey), this.getMap(puKey), this.getMap(hKey)])
        .then(([prMap, puMap, hMap]) => {
          toDelete = [
            ...this.resetHelper(prMap, prKey, id),
            ...this.resetHelper(puMap, puKey, id),
            ...this.resetHelper(hMap, hKey, id),
          ];
        })
        .then(() => this.del(toDelete))
        .then(() => {
          if (!keepAlive) this.close();
          resolve();
        })
        .catch(console.info);
    });
  }

  resetHelper(
    map: IObject<string>,
    queryKey: string,
    postId: string
  ): string[] {
    const fullKeys = [];
    for (const queryDateLimit of Object.keys(map)) {
      if (map[queryDateLimit].includes(postId)) {
        this.hdel(queryKey, queryDateLimit);
        fullKeys.push(queryKey + Flag.DATE_TAG + queryDateLimit);
      }
    }
    return fullKeys;
  }

  newPostCreated(post: IPost, keepAlive = true): Promise<void> {
    return new Promise((resolve) => {
      const { username, isPrivate } = post;
      const privateQUser = this.getPrimaryKey(username, isPrivate);
      let toDelete = [privateQUser];
      if (!isPrivate) {
        const publicQUser = this.getPrimaryKey(username, true); // public Q for user
        const publicQHome = this.getPrimaryKey("", false); // public Q for recent
        toDelete = [privateQUser, publicQUser, publicQHome];
      }
      this.del(toDelete)
        .then(() => {
          if (!keepAlive) this.close();
          resolve();
        })
        .catch(console.info);
    });
  }

  getPrimaryKey(username: string, isPrivate: boolean) {
    return `${Flag.USER_TAG}${username || ""}${Flag.PRIVATE_TAG}${
      isPrivate || false
    }`;
  }

  getKeys(username: string, isPrivate: boolean, date: string, limit: number) {
    const queryKey = this.getPrimaryKey(username, isPrivate);
    const queryDateLimit = (date || Flag.CURRENT) + Flag.LIMIT_TAG + limit;
    const cacheKey = queryKey + Flag.DATE_TAG + queryDateLimit;
    return { queryKey, queryDateLimit, cacheKey };
  }
}

export default RedisConnection;
