const { Token, Request, useApi } = require("./index");

const APIVERSION = 1;
const URL = "http://localhost:3000/v/";

const logout = () => {
  console.log("logout");
};
const onInvToken = () => {
  console.log("tokenInv");
};
const on410 = () => {};
const onNotOnline = () => {
  console.log("offline");
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
    const apiToken = await get("user/apiToken").authPW(
      user.email,
      user.loginToken
    );
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

  authUser(user) {
    // Define a method for authenticating with a user token.
    // This will be called by you, when you want to authenticate with a user
    this._auth = MyToken.getAPIToken(user);
    return this;
  }

  async middleware() {
    // Tell Request what to do on recieving not-yet caught errors, that should be
    // handled globally.

    this.on(410, on410);
    this.on({ status: 401, error: "Token invalid" }, onInvToken);
    this.on(401, logout);
    this.on(0, onNotOnline);
  }
}

const { get, put, patch, post, del } = useApi(MyRequest);
module.exports = { get, put, patch, post, del };
