import { genEndpoint, genErrorCatchers } from "./genEndpoint";
import { prettify } from "./prettify";

describe("genErrorCatchers", () => {
  it("should generate error catchers", async () => {
    const errorCatchers = genErrorCatchers("post", "V1User", {
      400: [
        { status: 400, error: "error" },
        { status: 400, error: "other error" },
      ],
    });
    expect(prettify("const a = {" + errorCatchers.join("\n") + "}")).toBe(
      prettify(`
const a = {
    on400: (fn: (p: PostV1User400Response) => void) => {
      return request.on<PostV1User400Response>(400, (p) => { fn(p); });
    },
    on400Error: (fn: (p: PostV1User400ErrorResponse) => void) => {
      return request.on<PostV1User400ErrorResponse>(
        { status: 400, error: "error" },
        (p) => { fn(p); }
      );
    },
    on400OtherError: (fn: (p: PostV1User400OtherErrorResponse) => void) => {
      return request.on<PostV1User400OtherErrorResponse>(
        { status: 400, error: "other error" },
        (p) => { fn(p); }
      );
    }
}
      `)
    );
  });
});

describe("genEndpoint", () => {
  it("should generate endpoint function", async () => {
    const { funcCode, path, typeCode } = genEndpoint({
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
    });

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
        .data(data).query(query);
  return Object.assign(request, {});
  }`)
    );
    expect(path).toStrictEqual(["user", "venue", "payment", "receipt", "post"]);
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
    const { funcCode, typeCode, path } = genEndpoint({
      method: "post",
      path: "/v/1/user",
      assertions: {},
      returns: [{ status: 200, value: "ok" }],
    });

    expect(prettify(funcCode)).toBe(
      prettify(`
 () => {
   const request = api
     .post<PostV1UserReturns>(
        "user",
        []);
  return Object.assign(request, {});
  }`)
    );
    expect(path).toStrictEqual(["user", "post"]);
    prettify(typeCode);
  });

  it("should generate endpoint function with multiple returns", async () => {
    const { funcCode, typeCode, path } = genEndpoint({
      method: "post",
      path: "/v/1/user",
      assertions: {},
      returns: [
        { status: 200, value: "ok" },
        { status: 200, value: "other ok" },
        { status: 400, error: "error" },
        { status: 400, error: "other error" },
      ],
    });

    const typeCodePretty = prettify(typeCode);
    expect(typeCodePretty).toMatch("PostV1User400ErrorResponse");
    expect(typeCodePretty).toMatch("PostV1User400Response");
    expect(typeCodePretty).toMatch("PostV1UserReturns");
    expect(typeCodePretty).toMatch("postV1User400OtherErrorResponseSchema");

    expect(prettify(funcCode)).toBe(
      prettify(`
() => {
  const request = api.post<PostV1UserReturns>("user", []);
  return Object.assign(request, {
    on400: (fn: (p: PostV1User400Response) => void) => {
      return request.on<PostV1User400Response>(400, (p) => { fn(p); });
    },
    on400Error: (fn: (p: PostV1User400ErrorResponse) => void) => {
      return request.on<PostV1User400ErrorResponse>(
        { status: 400, error: "error" },
        (p) => { fn(p); }
      );
    },
    on400OtherError: (fn: (p: PostV1User400OtherErrorResponse) => void) => {
      return request.on<PostV1User400OtherErrorResponse>(
        { status: 400, error: "other error" },
        (p) => { fn(p); }
      );
    },
  });
};`)
    );
    expect(path).toStrictEqual(["user", "post"]);
  });
});
