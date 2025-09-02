import { genFile, pathMatches, excludeEndpoints } from "./genFile";
import { prettify } from "./prettify";

describe("pathMatches", () => {
  it("should match paths", async () => {
    expect(pathMatches([["venue"]], ["venue", "dashboard"])).toBe(true);
    expect(pathMatches([["venue", "dashboard"]], ["venue", "dashboard"])).toBe(
      true
    );
    expect(
      pathMatches([["venue"], ["user", "login"]], ["venue", "dashboard"])
    ).toBe(true);
  });

  it("should not match paths", async () => {
    expect(pathMatches([["user"]], ["venue", "dashboard"])).toBe(false);
    expect(pathMatches([["venue", "user"]], ["venue", "dashboard"])).toBe(
      false
    );
    expect(
      pathMatches([["dashboard"], ["user", "login"]], ["venue", "dashboard"])
    ).toBe(false);
  });
});

describe("excludeEndpoints", () => {
  const endpoints = () => [
    { path: ["venue", "payments", "receipt"] },
    { path: ["venue", "order", "payments"] },
    { path: ["venue", "order", "customers"] },
    { path: ["user", "login"] },
    { path: ["user", "logout"] },
    { path: ["logs", "live"] },
  ];
  it("should keep all endpoints", async () => {
    expect(excludeEndpoints(endpoints())).toStrictEqual(endpoints());
    expect(excludeEndpoints(endpoints(), {})).toStrictEqual(endpoints());
  });
  it("should exclude some endpoints", async () => {
    expect(
      excludeEndpoints(endpoints(), {
        excludePaths: [["user"], ["venue", "payments"]],
      })
    ).toStrictEqual([
      { path: ["venue", "order", "payments"] },
      { path: ["venue", "order", "customers"] },
      { path: ["logs", "live"] },
    ]);
  });
  it("should include some endpoints", async () => {
    expect(
      excludeEndpoints(endpoints(), {
        includePaths: [["user"], ["venue", "payments"], ["logs", "live"]],
      })
    ).toStrictEqual([
      { path: ["venue", "payments", "receipt"] },
      { path: ["user", "login"] },
      { path: ["user", "logout"] },
      { path: ["logs", "live"] },
    ]);
  });
});

describe("genFile", () => {
  it("should generate file", async () => {
    const file = genFile([
      {
        method: "post",
        path: "/v/1/user",
        assertions: {},
        returns: [{ status: 200, value: "ok" }],
        title: "Add user",
      },
      {
        method: "get",
        path: "/v/1/user",
        assertions: {},
        returns: [{ status: 200, value: "ok" }],
        title: "Get user",
      },
      {
        method: "get",
        path: "/v/1/user/:userId",
        assertions: { params: { userId: { type: "id" } } },
        returns: [{ status: 200, value: "ok" }],
        title: "Get user by id",
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
export const getV1UserUserIdReturnsSchema = schema.oneOf([schema.value("ok")]);
export type GetV1UserUserIdReturns = schema.InferType<typeof getV1UserUserIdReturnsSchema>;
export const getV1UserUserIdParamsSchema = schema.obj({ userId: schema.int().semantic("id") });
export type GetV1UserUserIdParams = schema.InferType<typeof getV1UserUserIdParamsSchema>;
export const createApi = (api: ApiType) => {
  return {
    v1: {
      user: {
        post: () => {
          const request = api.post<PostV1UserReturns>("user", []).v(1);
          const enrichedRequest = Object.assign(request, {});
          return enrichedRequest;
        },
        get: () => {
          const request = api.get<GetV1UserReturns>("user", []).v(1);
          const enrichedRequest = Object.assign(request, {});
          return enrichedRequest;
        },
        byUserId: {
          get: ({params}: {params: GetV1UserUserIdParams}) => {
            const request = api.get<GetV1UserUserIdReturns>("user/$1", [params.userId]).v(1);
            const enrichedRequest = Object.assign(request, {});
            return enrichedRequest;
          },
        }
      },
    },
  };
};
      `)
    );
  });

  it("should generate file with ts types", async () => {
    const file = genFile(
      [
        {
          method: "post",
          path: "/v/1/user",
          assertions: {},
          returns: [{ status: 200, value: "ok" }],
          title: "Add user",
        },
        {
          method: "get",
          path: "/v/1/user",
          assertions: {},
          returns: [{ status: 200, value: "ok" }],
          title: "Get user",
        },
        {
          method: "get",
          path: "/v/1/user/:userId",
          assertions: { params: { userId: { type: "id" } } },
          returns: [{ status: 200, value: "ok" }],
          title: "Get user by id",
        },
      ],
      { emitNoSchema: true }
    );
    expect(prettify(file)).toBe(
      prettify(`
import { ApiType } from "@apparts/api";

export type PostV1UserReturns = "ok";
export type GetV1UserReturns = "ok";
export type GetV1UserUserIdReturns = "ok";
export type GetV1UserUserIdParams = { userId: number };
export const createApi = (api: ApiType) => {
  return {
    v1: {
      user: {
        post: () => {
          const request = api.post<PostV1UserReturns>("user", []).v(1);
          const enrichedRequest = Object.assign(request, {});
          return enrichedRequest;
        },
        get: () => {
          const request = api.get<GetV1UserReturns>("user", []).v(1);
          const enrichedRequest = Object.assign(request, {});
          return enrichedRequest;
        },
        byUserId: {
          get: ({params}: {params: GetV1UserUserIdParams}) => {
            const request = api.get<GetV1UserUserIdReturns>("user/$1", [params.userId]).v(1);
            const enrichedRequest = Object.assign(request, {});
            return enrichedRequest;
          },
        }
      },
    },
  };
};`)
    );
  });
});
