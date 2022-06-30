const APITOKEN_THRESHOLD = 1000 * 60;

const tokens: { [k: string]: Token<unknown> } = {};
export abstract class Token<User> {
  protected _user: User;
  private _renewing?: Promise<string>;
  protected _apiToken?: string;

  constructor(user: User) {
    this._user = user;
    this.renew().catch(() => {
      /* empty */
    });
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

  abstract renewAPIToken(user: User): Promise<string>;

  async renew() {
    if (this._renewing) {
      return await this._renewing.finally();
    }
    this._apiToken = undefined;
    this._renewing = new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        this._renewing = undefined;
        rej();
        // offline
        // TODO: something
      }, APITOKEN_THRESHOLD);
      this.renewAPIToken(this._user)
        .then((token) => {
          clearTimeout(timeout);
          this._apiToken = token;
          this._renewing = undefined;
          res(token);
        })
        .catch((e) => {
          clearTimeout(timeout);
          this._renewing = undefined;
          rej(e);
        });
    });
    return await this._renewing;
  }

  static getUserKey(user: unknown): string {
    throw "Token not overloaded correctly: getUserKey missing";
  }

  static getAPIToken<User>(user: User) {
    if (!tokens[this.getUserKey(user)]) {
      tokens[this.getUserKey(user)] = new (this.prototype.constructor as new (
        u: User
      ) => Token<User>)(user);
    }
    return tokens[this.getUserKey(user)];
  }
}
