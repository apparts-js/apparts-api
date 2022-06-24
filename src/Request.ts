import axios from "axios";
import { Token } from "./Token";

export abstract class Request<R> {
  private _codeCatchers;
  private _apiVersion: string | number;
  private _uri;
  private _params;
  private _method;
  private _query;
  protected _auth;
  private _data;
  private _settings;
  private _secondTry;
  private _p;

  constructor(uri: string, params: unknown[], method: (a, b, c) => Promise<R>) {
    this._codeCatchers = [];
    this._apiVersion = this.getAPIVersion();
    this._uri = uri;
    this._params = params || [];
    if (!Array.isArray(this._params)) {
      this._params = [this._params];
    }
    this._method = method;
    return this;
  }

  abstract getURL(apiVersion: string | number): string;
  abstract getAPIVersion(): string | number;

  notAuthenticated() {
    /* dummy */
  }
  online() {
    /* dummy */
  }

  query(params: unknown) {
    if (typeof params !== "object") {
      throw new Error("Request.query: params must be an object");
    }
    this._query = params;
    return this;
  }
  on(
    status: number | { error: string; status: number },
    next: (data: unknown, error: unknown) => unknown
  ) {
    if (typeof status !== "number") {
      if (typeof status !== "object") {
        throw new Error("Request.on: status must be number or object");
      } else if (!status.error || !status.status) {
        throw new Error(
          "Request.on: status object must contain error and status"
        );
      }
    }
    this._codeCatchers.push({
      status,
      next,
    });
    return this;
  }
  auth(auth) {
    this._auth = auth;
    return this;
  }
  authPW(username: string, password: string) {
    this._auth = { auth: { username, password } };
    return this;
  }
  authAPIKey(token: string) {
    this._auth = {
      headers: {
        Authorization: token,
      },
    };
    return this;
  }
  data(data: unknown) {
    this._data = data;
    return this;
  }
  settings(settings) {
    this._settings = settings;
    return this;
  }
  v(v: string | number) {
    this._apiVersion = v;
    return this;
  }
  async middleware() {
    /* empty */
  }
  async run() {
    await this.middleware();
    const prepedUri = this._prepareStatement(
      this._uri,
      this._params,
      this._query
    );
    const auth =
      this._auth instanceof Token ? await this._auth.getToken() : this._auth;
    const request = () =>
      this._method(this.getURL(this._apiVersion) + prepedUri, this._data, {
        ...auth,
        ...this._settings,
      });
    try {
      const res = await this._handleAPI(
        request,
        this._codeCatchers,
        !this._secondTry && this._auth && this._auth.renew
      );
      return res;
    } catch (e) {
      if (e === "Token invalid" && !this._secondTry) {
        this._secondTry = true;
        await this._auth.renew();
        return await this.run();
      } else if (e === "Token invalid") {
        this.notAuthenticated();
      }
      throw e;
    }
  }

  private async _handleAPI(request, codeCatchers, canRecover401) {
    try {
      const { data } = await request();
      this.online();
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const code = (error && error.response && error.response.status) || 0,
          data = error && error.response && error.response.data;

        if (
          code === 401 &&
          (data || {}).error === "Token invalid" &&
          canRecover401
        ) {
          return Promise.reject("Token invalid");
        }

        const catcher = codeCatchers.find(({ status }) =>
          typeof status === "number"
            ? status === code
            : status.status === code && status.error === (data || {}).error
        );

        if (code !== 0) {
          this.online();
        }

        if (catcher) {
          catcher.next(error.response && error.response.data, error);
          return Promise.reject(false);
        }
        console.log("COULD NOT DO ", this.formatAPIError(error));
      }

      return Promise.reject(error);
    }
  }

  private formatAPIError(apiError) {
    if (apiError && apiError.request) {
      const error = `${apiError.request._method} ${apiError.request._url}
  -> ${(apiError.response || {}).status}:
     Data: ${JSON.stringify((apiError.response || {}).data)}
     Body: ${((apiError.response || {}).request || {})._response}
`;

      return error;
    } else {
      return apiError;
    }
  }

  private _getP(): Promise<R> {
    if (!this._p) {
      this._p = this.run();
    }
    return this._p;
  }
  private _prepareStatement(uri, params = [], query = {}) {
    let queryparams = "";
    if (query) {
      queryparams =
        "?" +
        Object.keys(query)
          .map((key) => {
            let val = query[key];
            if (typeof val === "object") {
              val = JSON.stringify(val);
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
          })
          .join("&");
    }

    const preTransformUri = uri;
    params.forEach((param, i) => {
      if (!uri.match(new RegExp("\\$" + (i + 1)))) {
        console.log(
          "Too many parameters for prepared statement",
          preTransformUri,
          params
        );
        throw "Too many parameters for prepared statement";
      }
      let val = param;
      if (typeof val === "object") {
        val = JSON.stringify(val);
      }

      uri = uri.replace(
        new RegExp("\\$" + (i + 1), "g"),
        encodeURIComponent(val)
      );
    });
    if (uri.match(new RegExp("\\$"))) {
      console.log(
        "Too few parameters for prepared statement",
        preTransformUri,
        params
      );
      throw "Too few parameters for prepared statement";
    }
    return "/" + uri + queryparams;
  }
  then(
    onfulfilled?: (value: R) => R | PromiseLike<R>,
    onrejected?: (reason: any) => PromiseLike<never>
  ): Promise<R> {
    return this._getP().then(onfulfilled, onrejected);
  }
  catch(...ps) {
    return this._getP().catch(...ps);
  }
  finally(...ps) {
    return this._getP().finally(...ps);
  }
}
