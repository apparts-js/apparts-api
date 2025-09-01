import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Token } from "./Token";
import {
  PreparedStatementError,
  RetryError,
  TokenInvalidError,
} from "./errors";

type ErrorIdentifier = number | { error: string; status: number };

type CodeCatcher = {
  status: ErrorIdentifier;
  next: (data: any, error: unknown) => void;
};

type ErrorRetrier = {
  status: ErrorIdentifier;
  retryCount: number;
  delay: number;
};

export abstract class Request<R> {
  private _retryOn: ErrorRetrier[] = [];
  private _codeCatchers: CodeCatcher[];
  private _apiVersion: string | number;
  private _uri: string;
  private _params: unknown[];
  private _method: (
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ) => Promise<AxiosResponse<R>>;
  private _query: Record<string, unknown> | undefined;
  protected _auth;
  private _data: unknown;
  private _settings: AxiosRequestConfig | undefined;
  private _secondTry = false;
  private _p: Promise<any> | undefined;

  constructor(
    uri: string,
    params: unknown = [],
    method: (
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ) => Promise<AxiosResponse<R>>
  ) {
    this._codeCatchers = [];
    this._apiVersion = this.getAPIVersion();
    this._uri = uri;
    if (!Array.isArray(params)) {
      this._params = [params];
    } else {
      this._params = params;
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

  query(params: Record<string, unknown> | undefined) {
    if (typeof params !== "object") {
      throw new Error("Request.query: params must be an object");
    }
    this._query = params;
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  on<T>(status: ErrorIdentifier, next: (data: T, error: unknown) => void) {
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

  retryOn(status: ErrorIdentifier, retryCount: number, delay = 0) {
    this._retryOn.push({
      status,
      retryCount,
      delay,
    });
    return this;
  }

  auth(auth: Token<any>) {
    this._auth = auth;
    return this;
  }
  authBasic(username: string, password: string) {
    this._auth = { auth: { username, password } };
    return this;
  }
  authBearer(token: string) {
    this._auth = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    return this;
  }
  data(data: unknown) {
    this._data = data;
    return this;
  }
  settings(settings: AxiosRequestConfig) {
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
        !this._secondTry && this._auth && this._auth.renew
      );
      return res;
    } catch (e) {
      if (e instanceof RetryError) {
        return await this.run();
      }

      if (e instanceof TokenInvalidError && !this._secondTry) {
        this._secondTry = true;
        await this._auth.renew();
        return await this.run();
      } else if (e instanceof TokenInvalidError) {
        this.notAuthenticated();
      }
      throw e;
    }
  }

  private async _handleAPI(
    request: () => Promise<AxiosResponse>,
    canRecover401: boolean
  ): Promise<any> {
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
          return Promise.reject(new TokenInvalidError());
        }

        const retrierer = this._retryOn.find(({ status }) =>
          this.matchErrorIdentifier(status, code, data)
        );
        if (retrierer && retrierer.retryCount > 0) {
          if (retrierer.delay > 0) {
            await new Promise((res) => setTimeout(res, retrierer.delay));
          }
          retrierer.retryCount--;
          return Promise.reject(new RetryError());
        }

        const catcher = this._codeCatchers.find(({ status }) =>
          this.matchErrorIdentifier(status, code, data)
        );

        if (code !== 0) {
          this.online();
        }

        if (catcher) {
          catcher.next(error.response && error.response.data, error);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          return Promise.reject(false);
        }
      }

      return Promise.reject(error as Error);
    }
  }

  private matchErrorIdentifier(
    errorIdentifier: ErrorIdentifier,
    code: number,
    data: any
  ) {
    return typeof errorIdentifier === "number"
      ? errorIdentifier === code
      : errorIdentifier.status === code &&
          errorIdentifier.error === (data || {}).error;
  }

  private _getP(): Promise<R> {
    if (!this._p) {
      this._p = this.run();
    }
    return this._p as Promise<R>;
  }
  private _prepareStatement(uri: string, params: unknown[] = [], query = {}) {
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
      if (!uri.match(new RegExp("\\$" + String(i + 1)))) {
        throw new PreparedStatementError(
          "Too many parameters for prepared statement",
          uri
        );
      }
      let val = param;
      if (typeof val === "object") {
        val = JSON.stringify(val);
      }

      uri = uri.replace(
        new RegExp("\\$" + String(i + 1), "g"),
        encodeURIComponent(String(val))
      );
    });
    if (uri.match(new RegExp("\\$"))) {
      throw new PreparedStatementError(
        "Too few parameters for prepared statement",
        preTransformUri
      );
    }
    return "/" + uri + queryparams;
  }
  then(
    onfulfilled?: (value: R) => R | PromiseLike<R>,
    onrejected?: (reason: unknown) => PromiseLike<never>
  ): Promise<R> {
    return this._getP().then(onfulfilled, onrejected);
  }
  catch(...ps) {
    return this._getP().catch(...ps);
  }
  finally(...ps) {
    return this._getP().finally(...ps);
  }
  getRequestConfig() {
    return {
      uri: this._uri,
      params: this._params,
      query: this._query,
      data: this._data,
    };
  }
}
