import { NextRouter } from "next/router";
import { RedisClientType } from "redis";
import { APIAction, Status } from "./enums";

export type AlertStatus = "success" | "info" | "warning" | "error";

/*------------------------------ API ------------------------------*/

export interface IResponse<T = any> {
  status?: number;
  message?: string;
  data?: T;
  ETag?: string;
}

/*------------------------------ . ------------------------------*/

export interface IObject<T = any> {
  [key: string]: T;
}

export interface IAppContext {
  user: IUser;
  userToken: string;
  history: string[];
  router: NextRouter;
  userSessionActive: boolean;
  theme: ITheme;
  setThemeName: (theme?: string) => void;
  routerPush: (route: string) => void;
  routerBack: () => void;
  logout: () => void;
  updatePostSlugs: (user: IUser) => void;
  handleUser: (token: string, user: IUser) => void;
}

export interface ITheme {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  highlightColor: string;
  mainText: string;
  mainTextDisabled: string;
  icon: string;
}

export interface IThemeOptions {
  [key: string]: ITheme;
}

export interface IAlert {
  status: Status;
  message?: string;
}

interface IRequest {
  userId: string;
}

interface IHasId {
  id: string;
  _id?: string;
}

interface IHasTimestamps {
  createdAt: string;
  updatedAt: string;
}

interface IHasImage {
  imageKey: string;
}

export interface IPost
  extends Partial<IHasId>,
    Partial<IHasImage>,
    Partial<IHasTimestamps> {
  slug?: string;
  username?: string;
  user?: IUser;
  title?: string;
  body?: string;
  isPrivate?: boolean;
  hasMarkdown?: boolean;
}

export interface IPostReq extends IPost, IRequest {
  update: boolean;
  limit?: number;
  sort?: 1 | -1;
  cursor?: string;
}

export interface IUser extends IHasId, Partial<IHasTimestamps> {
  id: string;
  avatarKey: string;
  bio: string;
  email: string;
  password: string;
  username: string;
  posts: IPost[];
}

export interface IUserReq extends IUser, IRequest {
  login: boolean;
  action: APIAction;
}
