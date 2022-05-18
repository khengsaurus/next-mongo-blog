import { NextRouter } from "next/router";
import { APIAction, Status } from "./enums";

export type AlertStatus = "success" | "info" | "warning" | "error";

/*------------------------------ API ------------------------------*/

export interface IResponse {
  status?: number;
  message?: string;
  data?: any;
}

/*------------------------------ . ------------------------------*/

export interface IAppContext {
  user: IUser;
  userToken: string;
  darkMode: boolean;
  router: NextRouter;
  sessionValidation: Status;
  logout: () => void;
  handleUser: (token: string, user: IUser) => void;
  setDarkMode: (_?: boolean) => void;
}

export interface IAlert {
  status: Status;
  message?: string;
}

interface IRequest {
  userId: string;
}

interface IHasId {
  id?: string;
  _id?: string;
}

export interface IImage {
  name: string;
  img: any;
}

export interface IPost extends IHasId {
  user: IUser;
  username: string;
  title: string;
  slug: string;
  body: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  image?: IImage;
}

export interface IPostReq extends IPost, IRequest {
  update: boolean;
  count?: number;
}

export interface IUser extends IHasId {
  id: string;
  avatar: string;
  bio: string;
  createdAt: string;
  email: string;
  password: string;
  username: string;
}

export interface IUserReq extends IUser, IRequest {
  login: boolean;
  action: APIAction;
}
