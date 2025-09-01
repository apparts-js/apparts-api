import { Token, Request, useApi } from "./index";
import { ApiFnParams } from "./api";
export const functions = {
  logout: () => {
    /**/
  },
  onInvToken: () => {
    /**/
  },
  on410: () => {
    /**/
  },
  onNotOnline: () => {
    /**/
  },
  online: () => {
    /**/
  },
  renewed: () => {
    /**/
  },
  getToken: async () => {
    return (await globalGet("apiToken")) as string;
  },
};

let globalGet;

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
    const apiToken = await functions.getToken();
    functions.renewed();
    return apiToken;
  }

  static getUserKey(user: User) {
    // Tell Token how to identify users
    return user.email;
  }
}

class MyRequest<T> extends Request<T> {
  private url = "";
  private apiVersion = 1;
  setUrl(url: string) {
    this.url = url;
    return this;
  }
  setAPIVersion(v: number) {
    this.apiVersion = v;
    return this;
  }

  getURL(apiVersion: string) {
    // Tell Request what the URL prefix is
    return this.url + (apiVersion || String(this.apiVersion));
  }
  getAPIVersion() {
    // Tell Request what the default APIVersion is
    return this.apiVersion;
  }

  online() {
    functions.online();
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
    this.on(410, functions.on410);
    this.on({ status: 401, error: "Token invalid" }, functions.onInvToken);
    this.on(401, functions.logout);
    this.on(0, functions.onNotOnline);
  }
}

export const getApi = (port: number) => {
  const APIVERSION = 1;
  const URL = `http://localhost:${String(port)}/v/`;

  const api = useApi(MyRequest);
  const { get, put, patch, post, del } = api;

  globalGet = <T>(...ps: ApiFnParams) =>
    (get(...ps) as unknown as MyRequest<T>)
      .setUrl(URL)
      .setAPIVersion(APIVERSION);
  return {
    api,
    get: <T>(...ps: ApiFnParams) =>
      (get(...ps) as unknown as MyRequest<T>)
        .setUrl(URL)
        .setAPIVersion(APIVERSION),
    put: <T>(...ps: ApiFnParams) =>
      (put(...ps) as unknown as MyRequest<T>)
        .setUrl(URL)
        .setAPIVersion(APIVERSION),
    patch: <T>(...ps: ApiFnParams) =>
      (patch(...ps) as unknown as MyRequest<T>)
        .setUrl(URL)
        .setAPIVersion(APIVERSION),
    post: <T>(...ps: ApiFnParams) =>
      (post(...ps) as unknown as MyRequest<T>)
        .setUrl(URL)
        .setAPIVersion(APIVERSION),
    del: <T>(...ps: ApiFnParams) =>
      (del(...ps) as unknown as MyRequest<T>)
        .setUrl(URL)
        .setAPIVersion(APIVERSION),
    getToken: functions.getToken,
    logout: functions.logout,
    onInvToken: functions.onInvToken,
    on410: functions.on410,
    onNotOnline: functions.onNotOnline,
    online: functions.online,
    renewed: functions.renewed,
  };
};
