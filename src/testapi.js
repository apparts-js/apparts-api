const { Token, Request, useApi } = require("./index");

const APIVERSION = 1;
const URL = "http://localhost:3000/v/";

const logout = () => {};
const onInvToken = () => {};
const on410 = () => {};
const onNotOnline = () => {};
const online = () => {};
const renewed = () => {};

const getToken = async () => {
  return await get("apiToken");
};

class MyToken extends Token {
  constructor(user) {
    super(user);

    // Tell Token where to find the users api token, should you
    // already have one
    this._apiToken = user.apiToken;
  }

  async renewAPIToken(user) {
    // Tell Token how to renew the API Token
    const apiToken = await module.exports.getToken();
    module.exports.renewed();
    return apiToken;
  }

  static getUserKey(user) {
    // Tell Token how to identify users
    return user.email;
  }
}

class MyRequest extends Request {
  getURL(apiVersion) {
    // Tell Request what the URL prefix is
    return URL + apiVersion;
  }
  getAPIVersion() {
    // Tell Request what the default APIVersion is
    return APIVERSION;
  }

  online() {
    module.exports.online();
  }

  authUser(user) {
    // Define a method for authenticating with a user token.
    // This will be called by you, when you want to authenticate with a user
    this._auth = MyToken.getAPIToken(user);
    return this;
  }

  async middleware() {
    // Tell Request what to do on recieving not-yet caught errors, that should be
    // handled globally.

    this.on(410, module.exports.on410);
    this.on({ status: 401, error: "Token invalid" }, module.exports.onInvToken);
    this.on(401, module.exports.logout);
    this.on(0, module.exports.onNotOnline);
  }
}

const { get, put, patch, post, del } = useApi(MyRequest);
module.exports = {
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
