import { genFile } from "./genFile";
import { prettify } from "./prettify";

describe("genFile", () => {
  it("should generate file", async () => {
    const file = genFile([
      {
        method: "post",
        path: "/v/1/user",
        assertions: {},
        returns: [{ status: 200, value: "ok" }],
        title: "Add user",
        options: {},
      },
      {
        method: "get",
        path: "/v/1/user",
        assertions: {},
        returns: [{ status: 200, value: "ok" }],
        title: "Get user",
        options: {},
      },
    ]);
    expect(prettify(file)).toBe(
      prettify(`
import * as schema from "@apparts/types";
import { ApiType } from "@apparts/api";

export const postV1UserReturnsSchema = schema.oneOf([schema.value("ok")]);
export type PostV1UserReturns = schema.InferType<typeof postV1UserReturnsSchema>;
export const getV1UserReturnsSchema = schema.oneOf([schema.value("ok")]);
export type GetV1UserReturns = schema.InferType<typeof getV1UserReturnsSchema>;

export const createApi = (api: ApiType) => {
  return {
    user: {
      post: () => {
        const request = api.post<PostV1UserReturns>("user", []);
        const enrichedRequest = Object.assign(request, {});
        return enrichedRequest;
      },
      get: () => {
        const request = api.get<GetV1UserReturns>("user", []);
        const enrichedRequest = Object.assign(request, {});
        return enrichedRequest;
      },
    },
  };
};
      `)
    );
  });
});
