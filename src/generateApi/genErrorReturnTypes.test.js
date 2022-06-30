import { genErrorReturnTypes, prepareErrors } from "./genErrorReturnTypes";

import { prettify } from "./prettify";

describe("prepareErrors", () => {
  it("should group errors", async () => {
    expect(
      prepareErrors([
        { status: 400, error: "error" },
        { status: 401, error: "error" },
        { status: 401, error: "other error" },
      ])
    ).toStrictEqual({
      400: [{ status: 400, error: "error" }],
      401: [
        { status: 401, error: "error" },
        { status: 401, error: "other error" },
      ],
    });
  });
  it("should remove duplicate errors", async () => {
    expect(
      prepareErrors([
        { status: 400, error: "error" },
        { status: 400, error: "error" },
        { status: 400, error: "other error" },
      ])
    ).toStrictEqual({
      400: [
        { status: 400, error: "error" },
        { status: 400, error: "other error" },
      ],
    });
  });
});

describe("genErrorReturnTypes", () => {
  it("should generate error returns", async () => {
    const errorReturns = genErrorReturnTypes("post", "V1User", {
      400: [
        { status: 400, error: "error" },
        { status: 400, error: "other error" },
      ],
    });
    expect(prettify(errorReturns.join("\n"))).toBe(
      prettify(`
export const postV1User400ResponseSchema = schema.oneOf([
  schema.obj({ error: schema.value("error") }),
  schema.obj({ error: schema.value("other error") }),
]);
export type PostV1User400Response = schema.InferType<
  typeof postV1User400ResponseSchema
>;

export const postV1User400ErrorResponseSchema = schema.obj({
  error: schema.value("error"),
});
export type PostV1User400ErrorResponse = schema.InferType<
  typeof postV1User400ErrorResponseSchema
>;

export const postV1User400OtherErrorResponseSchema = schema.obj({
  error: schema.value("other error"),
});
export type PostV1User400OtherErrorResponse = schema.InferType<
  typeof postV1User400OtherErrorResponseSchema
>;`)
    );
  });
});
