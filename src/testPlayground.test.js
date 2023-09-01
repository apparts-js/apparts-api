/**
 * @jest-environment node
 */
const myEndpoint = require("./testserver");
const app = myEndpoint.app;

const { api } = require("./testPlayground");

let server;
beforeEach(() => {
  server = app.listen(3001, () => {});
});
afterEach(() => {
  server && server.close();
});

describe("Generated API", () => {
  it("should return expected result", async () => {
    const res = await api.user.venue.order.payment.receipt.post({
      params: {
        venueId: 1,
        orderId: 2,
        paymentId: 10,
      },
    });
    expect(res).toStrictEqual({
      venueId: 1,
      orderId: 2,
      paymentId: 10,
    });
  });

  it("should return catch error", async () => {
    const mockOn = jest.fn(() => {});

    await expect(
      api.user.venue.order.payment.receipt
        .post({
          params: {
            venueId: 11,
            orderId: 10,
            paymentId: 10,
          },
        })
        .on400SpecificError(() => {
          /* does not matter */
        })
        .on400(mockOn)
    ).rejects.toBe(false);
    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0][0]).toMatchObject({
      error: "Something went wrong",
    });
  });
});
