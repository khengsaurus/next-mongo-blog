export enum Status {
  ERROR,
  IDLE,
  INFO,
  PENDING,
  SUCCESS,
}

export enum DBService {
  POSTS = "posts",
  USERS = "users",
  IMAGES = "images",
}

export enum HttpRequest {
  DELETE = "DELETE",
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
}

export enum PageRoute {
  HOME = "/",
  LOGIN = "/login",
  NEW_USER = "/new-user",
  POST_FORM = "/post-form",
  MY_PROFILE = "/my-profile",
  MY_POSTS = "/my-posts",
  EDIT_PROFILE = "/edit-profile",
}

export enum DurationMS {
  MIN = 1000 * 60,
  HOUR = 1000 * 60 * 60,
  DAY = 1000 * 60 * 60 * 24,
  WEEK = 1000 * 60 * 60 * 24 * 7,
}

export enum Dimension {
  BANNER_H = 350,
  CARD_W = 280,
  AVATAR_S = 24,
  AVATAR_M = 40,
  AVATAR_L = 140,
}

export enum Flag {
  CURRENT = "curr",
  PREVIEW = "preview",
  PREVIEW_IMG = "preview-img",
  USER_TAG = "u=",
  DATE_TAG = "d=",
  LIMIT_TAG = "l=",
  PRIVATE_TAG = "p=",
}

export enum TransitionSpeed {
  SLOW = "800ms",
  MEDIUM = "450ms",
  FAST = "300ms",
  INSTANT = "0ms",
}

export enum Transition {
  SLOW = 800,
  MEDIUM = 450,
  FAST = 300,
  INSTANT = 0,
}

export enum HttpResponse {
  _200 = "Success",
  _400 = "Bad request",
  _401 = "Unauthorized request",
  _404 = "Failed to find resource",
  _500 = "Internal server error",
  BAD_LOGIN = "Incorrect username or password",
  SERVER_LISTENING = "Server listening on port ",
  USERNAME_TAKEN = "Username already taken",
}

export enum ToastMessage {
  POST_EDITED = "Post edited successfully",
  POST_CREATED = "Post created successfully",
  POST_DELETED = "Post deleted successfully",

  POST_EDITED_FAIL = "Failed to edit post",
  POST_CREATED_FAIL = "Failed to create post",
  POST_DELETED_FAIL = "Failed to delete post",

  PROFILE_SAVE = "Profile saved successfully",
  PROFILE_SAVE_FAIL = "Failed to save profile",

  IMAGE_UPLOAD_FAIL = "Failed to upload image",
}

export enum ServerInfo {
  EMAIL_USED = "Email already used",
  USER_LOGIN = "User logged in successfully",
  USER_DELETED = "User deleted successfully",
  USER_NA = "User does not exist",
  USER_REGISTERED = "User registered",
  USER_RETRIEVED = "User retrieved",
  USER_UPDATED = "User updated",
  USERNAME_TAKEN = "Username already taken",
  USER_BAD_LOGIN = "Incorrect username or password",

  POST_CREATED = "Post created",
  POST_DELETED = "Post deleted",
  POST_RETRIEVED = "Post(s) retrieved",
  POST_RETRIEVED_CACHED = "Post(s) retrieved from cache",
  POST_UPDATED = "Post updated",
  POST_SLUGS_RETRIEVED = "Post slugs retrieved",
  POST_NA = "No post(s) found",

  FILE_DELETED = "File deleted",
  REQUEST_FAILED = "Server request failed",

  REDIS_SET_SUCCESS = "Redis - successful set",
  REDIS_GET_SUCCESS = "Redis - successful get",
  REDIS_DEL_SUCCESS = "Redis - successful del",

  REDIS_SET_FAIL = "Redis - failed set",
  REDIS_GET_FAIL = "Redis - failed get",
  REDIS_DEL_FAIL = "Redis - failed del",

  REDIS_HSET_SUCCESS = "Redis - successful hset",
  REDIS_HGET_SUCCESS = "Redis - successful hget",
  REDIS_HGETALL_SUCCESS = "Redis - successful hgetall",
  REDIS_HDEL_SUCCESS = "Redis - successful hdel",

  REDIS_HSET_FAIL = "Redis - failed hset",
  REDIS_HGETALL_FAIL = "Redis - failed hgetall",
  REDIS_HDEL_FAIL = "Redis - failed hdel",
}

export enum ErrorMessage {
  POST_SLUG_USED = "Slug already used",
  TRY_AGAIN = "Please try again",
  PW_NOT_MATCHING = "Passwords do not match",
  ONE_IMAGE_ONLY = "Only 1 image can be uploaded",

  POST_CREATE_FAIL = "Failed to create post",
  POST_DELETE_FAIL = "Failed to delete post",
  POST_RETRIEVE_FAIL = "Failed to retrieve post",
  POST_UPDATE_FAIL = "Failed to update post",

  IMAGE_DELETE_FAIL = "Failed to delete image",
  IMAGE_UPLOAD_FAIL = "Failed to upload image",
  IMAGE_DOWNLOAD_FAIL = "Failed to download image",
  IMAGE_UPLOAD_400 = "Image upload missing required params",
  IMAGE_UPLOAD_500 = "Image upload failed",
}

export enum APIAction {
  LOGIN = "login",
  REGISTER = "register",
  USER_TOKEN_LOGIN = "user-token-login",
  USER_SET_USERNAME = "user-set-username",
  GET_POST_SLUGS = "get-post-slugs",
  GET_UPLOAD_KEY = "get-upload-key",
  READ = "read",
}
