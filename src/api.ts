import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { Request } from "./Request";

export type ApiType = {
  get<T>(this: void, uri: string, params?: unknown): Request<T>;
  post<T>(this: void, uri: string, params?: unknown): Request<T>;
  put<T>(this: void, uri: string, params?: unknown): Request<T>;
  patch<T>(this: void, uri: string, params?: unknown): Request<T>;
  del<T>(this: void, uri: string, params?: unknown): Request<T>;
};

export type ApiFnParams = [uri: string, params?: unknown];

// Can not get the typing right, due to https://github.com/Microsoft/TypeScript/issues/1213

export const useApi = (
  Request: new <T>(
    uri: string,
    params: unknown,
    method: (
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ) => Promise<AxiosResponse<T>>
  ) => Request<any>
): ApiType => ({
  get: <T>(uri: string, params?: unknown) => {
    const obj = new Request<T>(uri, params, (a, _b, c) => axios.get(a, c));
    obj.data = () => {
      throw "GET Request cannot take data";
    };
    return obj as Request<T>;
  },

  post: <T>(uri: string, params?: unknown) => {
    return new Request<T>(uri, params, (a, b, c) =>
      axios.post(a, b, c)
    ) as Request<T>;
  },

  put: <T>(uri: string, params?: unknown) => {
    return new Request<T>(uri, params, (a, b, c) =>
      axios.put(a, b, c)
    ) as Request<T>;
  },

  patch: <T>(uri: string, params?: unknown) => {
    return new Request<T>(uri, params, (a, b, c) =>
      axios.patch(a, b, c)
    ) as Request<T>;
  },

  del: <T>(uri: string, params?: unknown) => {
    return new Request<T>(uri, params, (a, _b, c) =>
      axios.delete(a, c)
    ) as Request<T>;
  },
});
