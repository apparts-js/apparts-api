import { Token, Request, useApi } from "./index";

export const logout = () => {
  /**/
};
export const onInvToken = () => {
  /**/
};
export const on410 = () => {
  /**/
};
export const onNotOnline = () => {
  /**/
};
export const online = () => {
  /**/
};
export const renewed = () => {
  /**/
};

export const getToken = async () => {
  return (await globalGet("apiToken")) as string;
};

let globalGet;

export const getApi = (port: number) => {
  const APIVERSION = 1;
  const URL = `http://localhost:${port}/v/`;

  type User = { email: string; apiToken?: string };

  class MyToken extends Token<User> {
    constructor(user: User) {
      super(user);

      // Tell Token where to find the users api token, should you
      // already have one
      this._apiToken = user.apiToken;
    }

    async renewAPIToken() {
      // Tell Token how to renew the API Token
      const apiToken = await getToken();
      renewed();
      return apiToken;
    }

    static getUserKey(user: User) {
      // Tell Token how to identify users
      return user.email;
    }
  }

  class MyRequest<T> extends Request<T> {
    getURL(apiVersion: string) {
      // Tell Request what the URL prefix is
      return URL + apiVersion;
    }
    getAPIVersion() {
      // Tell Request what the default APIVersion is
      return APIVERSION;
    }

    online() {
      online();
    }

    authUser(user: User) {
      // Define a method for authenticating with a user token.
      // This will be called by you, when you want to authenticate with a user
      this._auth = MyToken.getAPIToken(user);
      return this;
    }

    async middleware() {
      // Tell Request what to do on recieving not-yet caught errors, that should be
      // handled globally.

      this.on(410, module.exports.on410);
      this.on(
        { status: 401, error: "Unauthorized" },
        module.exports.onInvToken
      );
      this.on(401, module.exports.logout);
      this.on(0, module.exports.onNotOnline);
    }
  }

  const api = useApi(MyRequest);
  const { get, put, patch, post, del } = api;
  globalGet = get;
  return {
    api,
    get,
    put,
    patch,
    post,
    del,
    getToken,
    logout,
    onInvToken,
    on410,
    onNotOnline,
    online,
    renewed,
  };
};
