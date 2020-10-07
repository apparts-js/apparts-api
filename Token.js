const APITOKEN_THRESHOLD = 1000 * 60;

const tokens = {};
class Token {
  constructor(user) {
    this._user = user;
    this.renew();
  }

  async getToken() {
    if (this._renewing) {
      await this._renewing.finally();
    }
    return {
      headers: {
        Authorization: "Bearer " + this._apiToken,
      },
    };
  }

  async renewAPIToken(user) {
    throw "Token not overloaded correctly: renewAPIToken missing";
  }

  async renew() {
    if (this._renewing) {
      return await this._renewing.finally();
    }
    this._apiToken = null;
    this._renewing = new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        this._renewing = null;
        rej();
        // offline
        // TODO: something
      }, APITOKEN_THRESHOLD);
      this.renewAPIToken(this._user).then((token) => {
        clearTimeout(timeout);
        this._apiToken = token;
        this._renewing = null;
        res(token);
      });
    });
    return this._renewing;
  }

  static getUserKey(user) {
    throw "Token not overloaded correctly: getUserKey missing";
  }

  static getAPIToken(user) {
    if (!tokens[this.getUserKey(user)]) {
      tokens[this.getUserKey(user)] = new this.prototype.constructor(user);
    }
    return tokens[this.getUserKey(user)];
  }
}

module.exports = Token;
