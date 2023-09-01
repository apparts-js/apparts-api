import { nameFromPath, nameFromString, createPath } from "./utils";

describe("nameFromPath", () => {
  it("should make good name", async () => {
    expect(
      nameFromPath(
        "/v/1/user/venue/:venueId/order/:orderId/payment/:paymentId/receipt"
      )
    ).toBe("V1UserVenueVenueIdOrderOrderIdPaymentPaymentIdReceipt");
  });
  it("should remove forbidden chars", async () => {
    expect(nameFromPath("/v/1/stats/2-!@#$%^&*()_+summary")).toBe(
      "V1Stats2Summary"
    );
  });
});

describe("nameFromString", () => {
  it("should make good name", async () => {
    expect(nameFromString("Other error")).toBe("OtherError");
  });
  it("should remove forbidden chars", async () => {
    expect(nameFromString("other error/2-!@#$%^&*()_+yay")).toBe(
      "OtherError2Yay"
    );
  });
});

describe("createPath", () => {
  it("should create path", async () => {
    expect(
      createPath("/v/1/user/venue/:venueId/order/:orderId/payment", {
        venueId: { type: "id" },
        orderId: { type: "id" },
      })
    ).toStrictEqual({
      version: "1",
      path: "user/venue/$1/order/$2/payment",
      params: ["venueId", "orderId"],
      parts: ["user", "venue", "order", "payment"],
    });
  });
  it("should create path with trailing parameter", async () => {
    expect(
      createPath("/v/1/user/venue/:venueId/order/:orderId/payment/:paymentId", {
        venueId: { type: "id" },
        orderId: { type: "id" },
        paymentId: { type: "id" },
      })
    ).toStrictEqual({
      version: "1",
      path: "user/venue/$1/order/$2/payment/$3",
      params: ["venueId", "orderId", "paymentId"],
      parts: ["user", "venue", "order", "payment", "byPaymentId"],
    });
  });
});
