import { Token } from "./Token";

export class Request extends Promise {
  constructor(uri, params, method) {
    super(() => {});
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

  getURL(apiVersion) {
    throw new Error("Request not setup correctly, getURL not overloaded");
  }
  getAPIVersion() {
    throw new Error(
      "Request not setup correctly, getAPIVersion not overloaded"
    );
  }

  online() {}

  query(params) {
    if (typeof params !== "object") {
      throw new Error("Request.query: params must be an object");
    }
    this._query = params;
    return this;
  }
  on(status, next) {
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
  authPW(username, password) {
    this._auth = { auth: { username, password } };
    return this;
  }
  authAPIKey(token) {
    this._auth = {
      headers: {
        Authorization: token,
      },
    };
    return this;
  }
  data(data) {
    this._data = data;
    return this;
  }
  settings(settings) {
    this._settings = settings;
    return this;
  }
  v(v) {
    this._apiVersion = v;
    return this;
  }
  async middleware() {}
  async run() {
    try {
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
    } catch (e) {
      throw e;
    }
  }

  async _handleAPI(request, codeCatchers, canRecover401) {
    try {
      const { data } = await request();
      this.online();
      return data;
    } catch (error) {
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

      return Promise.reject(error);
    }
  }

  formatAPIError(apiError) {
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

  _getP() {
    if (!this._p) {
      this._p = this.run();
    }
    return this._p;
  }
  _prepareStatement(uri, params = [], query = {}) {
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
  then(...ps) {
    return this._getP().then(...ps);
  }
  catch(...ps) {
    return this._getP().catch(...ps);
  }
  finally(...ps) {
    return this._getP().finally(...ps);
  }
}
