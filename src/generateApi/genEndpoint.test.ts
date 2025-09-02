import { genEndpoint, genErrorCatchers } from "./genEndpoint";
import { prettify } from "./prettify";

describe("genErrorCatchers", () => {
  it("should generate error catchers", async () => {
    const errorCatchers = genErrorCatchers("post", "V1User", {
      400: [
        {
          status: 400,
          error: "error",
          returnType: {
            type: "object",
            keys: {
              error: {
                value: "error",
              },
            },
          },
        },
        {
          status: 400,
          error: "other error",
          returnType: {
            type: "object",
            keys: { error: { value: "other error" } },
          },
        },
      ],
      401: [{ status: 401, returnType: { type: "string" } }],
    });
    expect(prettify("const a = {" + errorCatchers.join("\n") + "}")).toBe(
      prettify(`
const a = {
    on400: (fn: (p: PostV1User400Response) => void) => {
      request.on<PostV1User400Response>(400, (p) => { fn(p); });
      return enrichedRequest;
    },
    on400Error: (fn: (p: PostV1User400ErrorResponse) => void) => {
      request.on<PostV1User400ErrorResponse>(
        { status: 400, error: "error" },
        (p) => { fn(p); }
      );
      return enrichedRequest;
    },
    on400OtherError: (fn: (p: PostV1User400OtherErrorResponse) => void) => {
      request.on<PostV1User400OtherErrorResponse>(
        { status: 400, error: "other error" },
        (p) => { fn(p); }
      );
      return enrichedRequest;
    },
    on401: (fn: (p: PostV1User401Response) => void) => {
      request.on<PostV1User401Response>(401, (p) => { fn(p); });
      return enrichedRequest;
    }
}
      `)
    );
  });
});

describe("genEndpoint", () => {
  it("should generate endpoint function", async () => {
    const { funcCode, path, typeCode } = genEndpoint(
      {
        method: "post",
        path: "/v/1/user/venue/:venueId/payment/:paymentId/receipt",
        assertions: {
          params: {
            venueId: { type: "id" },
            paymentId: { type: "id" },
          },
          query: { uuid: { type: "uuidv4" } },
          body: {
            email: { type: "email" },
          },
        },
        returns: [{ status: 200, value: "ok" }],
      },
      { emitNoSchema: false }
    );

    expect(prettify(funcCode)).toBe(
      prettify(`
 ({ params, data, query }: {
   params: PostV1UserVenueVenueIdPaymentPaymentIdReceiptParams;
   data: PostV1UserVenueVenueIdPaymentPaymentIdReceiptBody;
   query: PostV1UserVenueVenueIdPaymentPaymentIdReceiptQuery;
 }) => {
   const request = api
     .post<PostV1UserVenueVenueIdPaymentPaymentIdReceiptReturns>(
        "user/venue/$1/payment/$2/receipt",
        [params.venueId, params.paymentId])
        .data(data).query(query).v(1);
  const enrichedRequest = Object.assign(request, {});
  return enrichedRequest;
  }`)
    );
    expect(path).toStrictEqual([
      "v1",
      "user",
      "venue",
      "payment",
      "receipt",
      "post",
    ]);
    prettify(typeCode);

    expect(typeCode).toMatch(
      "PostV1UserVenueVenueIdPaymentPaymentIdReceiptReturns"
    );
    expect(typeCode).toMatch(
      "PostV1UserVenueVenueIdPaymentPaymentIdReceiptQuery"
    );
    expect(typeCode).toMatch(
      "PostV1UserVenueVenueIdPaymentPaymentIdReceiptBody"
    );
    expect(typeCode).toMatch(
      "PostV1UserVenueVenueIdPaymentPaymentIdReceiptParams"
    );
  });

  it("should generate endpoint function with optional assertion component", async () => {
    const { funcCode, typeCode, path } = genEndpoint(
      {
        method: "post",
        path: "/v/1/user",
        assertions: {},
        returns: [{ status: 200, value: "ok" }],
      },
      { emitNoSchema: false }
    );

    expect(prettify(funcCode)).toBe(
      prettify(`
 () => {
   const request = api
     .post<PostV1UserReturns>(
        "user",
        []).v(1);
  const enrichedRequest = Object.assign(request, {});
  return enrichedRequest;
  }`)
    );
    expect(path).toStrictEqual(["v1", "user", "post"]);
    prettify(typeCode);
  });

  it("should generate endpoint function with multiple returns", async () => {
    const { funcCode, typeCode, path } = genEndpoint(
      {
        method: "post",
        path: "/v/1/user",
        assertions: {},
        returns: [
          { status: 200, value: "ok" },
          { status: 200, value: "other ok" },
          { status: 400, error: "error" },
          { status: 400, error: "other error" },
        ],
      },
      { emitNoSchema: false }
    );

    const typeCodePretty = prettify(typeCode);
    expect(typeCodePretty).toMatch("PostV1User400ErrorResponse");
    expect(typeCodePretty).toMatch("PostV1User400Response");
    expect(typeCodePretty).toMatch("PostV1UserReturns");
    expect(typeCodePretty).toMatch("postV1User400OtherErrorResponseSchema");

    expect(prettify(funcCode)).toBe(
      prettify(`
() => {
  const request = api.post<PostV1UserReturns>("user", []).v(1);
  const enrichedRequest = Object.assign(request, {
    on400: (fn: (p: PostV1User400Response) => void) => {
      request.on<PostV1User400Response>(400, (p) => { fn(p); });
      return enrichedRequest;
    },
    on400Error: (fn: (p: PostV1User400ErrorResponse) => void) => {
      request.on<PostV1User400ErrorResponse>(
        { status: 400, error: "error" },
        (p) => { fn(p); }
      );
      return enrichedRequest;
    },
    on400OtherError: (fn: (p: PostV1User400OtherErrorResponse) => void) => {
      request.on<PostV1User400OtherErrorResponse>(
        { status: 400, error: "other error" },
        (p) => { fn(p); }
      );
      return enrichedRequest;
    },
  });
  return enrichedRequest;
};`)
    );
    expect(path).toStrictEqual(["v1", "user", "post"]);
  });
});
