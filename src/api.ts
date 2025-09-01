import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { Request } from "./Request";

export type ApiType = {
  get<T>(uri: string, params?: unknown[] | undefined): Request<T>;
  post<T>(uri: string, params?: unknown[] | undefined): Request<T>;
  put<T>(uri: string, params?: unknown[] | undefined): Request<T>;
  patch<T>(uri: string, params?: unknown[] | undefined): Request<T>;
  del<T>(uri: string, params?: unknown[] | undefined): Request<T>;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const useApi = <R extends Request<any>>(
  Request: new <T>(
    uri: string,
    params: unknown[] | undefined,
    method: <Response = AxiosResponse<T>>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ) => Promise<Response>
  ) => R
): ApiType => ({
  get<T>(uri: string, params?: unknown[]) {
    const obj = new Request<T>(uri, params, (a, b, c) => axios.get(a, c));
    obj.data = () => {
      throw "GET Request cannot take data";
    };
    return obj;
  },

  post<T>(uri: string, params?: unknown[]) {
    return new Request<T>(uri, params, axios.post);
  },

  put<T>(uri: string, params?: unknown[]) {
    return new Request<T>(uri, params, axios.put);
  },

  patch<T>(uri: string, params?: unknown[]) {
    return new Request<T>(uri, params, axios.patch);
  },

  del<T>(uri: string, params?: unknown[]) {
    return new Request<T>(uri, params, (a, b, c) => axios.delete(a, c));
  },
});
