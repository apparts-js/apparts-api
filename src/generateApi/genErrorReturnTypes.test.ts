import {
  getErrorReturns,
  genErrorReturnTypes,
  prepareErrors,
  getSuccessReturns,
} from "./genErrorReturnTypes";

import { prettify } from "./prettify";

describe("getErrorReturns", () => {
  it("should return only error returns", async () => {
    expect(
      getErrorReturns([
        { status: 200, value: "ok" },
        { status: 404, error: "POS not found" },
        { status: 417, error: "POS not supported" },
        {
          status: 417,
          type: "object",
          keys: {
            error: { value: "Could not leave shift" },
            reason: { type: "string" },
          },
        },
        { status: 401, error: "Unauthorized" },
        { status: 401, error: "Token invalid" },
        { status: 400, error: "Fieldmissmatch" },
        { status: 402, type: "string" },
      ])
    ).toStrictEqual([
      {
        status: 404,
        error: "POS not found",
        returnType: {
          type: "object",
          keys: { error: { value: "POS not found" } },
        },
      },
      {
        status: 417,
        error: "POS not supported",
        returnType: {
          type: "object",
          keys: { error: { value: "POS not supported" } },
        },
      },
      {
        status: 417,
        error: "Could not leave shift",
        returnType: {
          type: "object",
          keys: {
            reason: { type: "string" },
            error: { value: "Could not leave shift" },
          },
        },
      },
      {
        status: 401,
        error: "Unauthorized",
        returnType: {
          type: "object",
          keys: { error: { value: "Unauthorized" } },
        },
      },
      {
        status: 401,
        error: "Token invalid",
        returnType: {
          type: "object",
          keys: { error: { value: "Token invalid" } },
        },
      },
      {
        status: 400,
        error: "Fieldmissmatch",
        returnType: {
          type: "object",
          keys: { error: { value: "Fieldmissmatch" } },
        },
      },
      { status: 402, returnType: { type: "string" } },
    ]);
  });
});

describe("getSuccessReturns", () => {
  it("should return only success returns", async () => {
    expect(
      getSuccessReturns([
        { status: 200, value: "ok" },
        {
          status: 417,
          type: "object",
          keys: {
            error: { value: "Could not leave shift" },
            reason: { type: "string" },
          },
        },
        { status: 401, error: "Unauthorized" },
        { status: 402, type: "string" },
      ])
    ).toStrictEqual([{ status: 200, value: "ok" }]);
  });
});

describe("prepareErrors", () => {
  it("should group errors", async () => {
    expect(
      prepareErrors([
        { status: 400, error: "error", returnType: { type: "string" } },
        { status: 401, error: "error", returnType: { type: "string" } },
        { status: 401, error: "other error", returnType: { type: "string" } },
        {
          status: 417,
          error: "Could not leave shift",
          returnType: {
            type: "string",
          },
        },
        {
          status: 402,
          returnType: {
            type: "string",
          },
        },
      ])
    ).toStrictEqual({
      400: [
        {
          status: 400,
          error: "error",
          returnType: {
            type: "string",
          },
        },
      ],
      401: [
        {
          status: 401,
          error: "error",
          returnType: {
            type: "string",
          },
        },
        {
          status: 401,
          error: "other error",
          returnType: {
            type: "string",
          },
        },
      ],
      402: [
        {
          status: 402,
          returnType: {
            type: "string",
          },
        },
      ],
      417: [
        {
          status: 417,
          error: "Could not leave shift",
          returnType: {
            type: "string",
          },
        },
      ],
    });
  });
  it("should remove duplicate errors", async () => {
    expect(
      prepareErrors([
        {
          status: 400,
          error: "error",
          returnType: {
            type: "string",
          },
        },
        {
          status: 400,
          error: "error",
          returnType: {
            type: "string",
          },
        },
        {
          status: 400,
          error: "other error",
          returnType: {
            type: "string",
          },
        },
      ])
    ).toStrictEqual({
      400: [
        {
          status: 400,
          error: "error",
          returnType: {
            type: "string",
          },
        },
        {
          status: 400,
          error: "other error",
          returnType: {
            type: "string",
          },
        },
      ],
    });
  });
});

describe("genErrorReturnTypes", () => {
  it("should generate error returns", async () => {
    const errorReturns = genErrorReturnTypes("post", "V1User", {
      400: [
        {
          status: 400,
          error: "error",
          returnType: {
            type: "object",
            keys: {
              error: { value: "error" },
            },
          },
        },
        {
          status: 400,
          error: "other error",
          returnType: {
            type: "object",
            keys: {
              error: { value: "other error" },
            },
          },
        },
        {
          status: 400,
          error: "Could not leave shift",
          returnType: {
            type: "object",
            keys: {
              reason: { type: "string" },
              error: { value: "Could not leave shift" },
            },
          },
        },
      ],
      402: [
        { status: 402, returnType: { value: "str1" } },
        { status: 402, returnType: { value: "str2" } },
      ],
    });
    expect(prettify(errorReturns.join("\n"))).toBe(
      prettify(`
export const postV1User400ResponseSchema = schema.oneOf([
  schema.obj({ error: schema.value("error") }),
  schema.obj({ error: schema.value("other error") }),
  schema.obj({
    reason: schema.string(),
    error: schema.value("Could not leave shift"),
 }),
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
>;

export const postV1User400CouldNotLeaveShiftResponseSchema = schema.obj({
  reason: schema.string(),
  error: schema.value("Could not leave shift"),
});
export type PostV1User400CouldNotLeaveShiftResponse = schema.InferType<
  typeof postV1User400CouldNotLeaveShiftResponseSchema
>;

export const postV1User402ResponseSchema = schema.oneOf([
  schema.value("str1"),
  schema.value("str2"),
]);
export type PostV1User402Response = schema.InferType<
  typeof postV1User402ResponseSchema
>;

      `)
    );
  });
});
