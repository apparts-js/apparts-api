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
      ])
    ).toStrictEqual([
      { status: 404, error: "POS not found" },
      { status: 417, error: "POS not supported" },
      {
        status: 417,
        error: "Could not leave shift",
        restType: {
          reason: { type: "string" },
        },
      },
      { status: 401, error: "Unauthorized" },
      { status: 401, error: "Token invalid" },
      { status: 400, error: "Fieldmissmatch" },
    ]);
  });
});

describe("getSuccessReturns", () => {
  it("should return only error returns", async () => {
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
      ])
    ).toStrictEqual([{ status: 200, value: "ok" }]);
  });
});

describe("prepareErrors", () => {
  it("should group errors", async () => {
    expect(
      prepareErrors([
        { status: 400, error: "error" },
        { status: 401, error: "error" },
        { status: 401, error: "other error" },
        {
          status: 417,
          error: "Could not leave shift",
          restType: {
            reason: { type: "string" },
          },
        },
      ])
    ).toStrictEqual({
      400: [{ status: 400, error: "error" }],
      401: [
        { status: 401, error: "error" },
        { status: 401, error: "other error" },
      ],
      417: [
        {
          status: 417,
          error: "Could not leave shift",
          restType: {
            reason: { type: "string" },
          },
        },
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
        {
          status: 400,
          error: "Could not leave shift",
          restType: {
            reason: { type: "string" },
          },
        },
      ],
    });
    expect(prettify(errorReturns.join("\n"))).toBe(
      prettify(`
export const postV1User400ResponseSchema = schema.oneOf([
  schema.obj({ error: schema.value("error") }),
  schema.obj({ error: schema.value("other error") }),
  schema.obj({ error: schema.value("Could not leave shift") }),
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
  error: schema.value("Could not leave shift"),
  reason: schema.string(),
});
export type PostV1User400CouldNotLeaveShiftResponse = schema.InferType<
  typeof postV1User400CouldNotLeaveShiftResponseSchema
>;`)
    );
  });
});
