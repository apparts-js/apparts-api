/**
 * @jest-environment node
 */

const request = require("supertest");
const axios = require("axios");

const myEndpoint = require("./testserver");
const app = myEndpoint.app;

const { get, put, patch, post, del } = require("./testapi");

let server;
beforeEach(() => {
  server = app.listen(3000, () => {});
});
afterEach(() => {
  server && server.close();
});

describe("Basic request", () => {
  test("Get", async () => {
    const res = await get("get");
    expect(res).toBe("ok get");
  });
  test("Post", async () => {
    const res = await post("post");
    expect(res).toBe("ok post");
  });
  test("Put", async () => {
    const res = await put("put");
    expect(res).toBe("ok put");
  });
  test("Patch", async () => {
    const res = await patch("patch");
    expect(res).toBe("ok patch");
  });
  test("Del", async () => {
    const res = await del("del");
    expect(res).toBe("ok del");
  });
});

describe("Requests with params", () => {
  test("Use parameters", async () => {
    const res = await get("params/$1/$2/$3/a", [1, 2, 3]);
    expect(res).toMatchObject({
      p1: "1",
      p2: "2",
      p3: "3",
    });
  });
  test("Use one parameter", async () => {
    const res = await get("params/$1/2/3/a", 1);
    expect(res).toMatchObject({
      p1: "1",
      p2: "2",
      p3: "3",
    });
  });
  test("Too few parameters", async () => {
    await expect(get("params/$1/$2/$3/a", [])).rejects.toBe(
      "Too few parameters for prepared statement"
    );
  });
  test("Too many parameters", async () => {
    await expect(get("params/$1/$2/$3/a", [1, 2, 3, 4])).rejects.toBe(
      "Too many parameters for prepared statement"
    );
  });
  test("Check encoding", async () => {
    const res = await get("params/$1/$2/3/a", ["/=?&", 2]);
    expect(res).toMatchObject({
      p1: "/=?&",
      p2: "2",
      p3: "3",
    });
  });
  test("Check array encoding", async () => {
    const res = await get("arrparams/$1", [[1, 2, 3]]);
    expect(res).toMatchObject({
      p1: [1, 2, 3],
    });
  });
});

describe("Different API Version", () => {
  test("Test v(2)", async () => {
    const res = await get("get").v(2);
    expect(res).toBe("ok get2");
  });
});

describe("Query params", () => {
  test("Get with a query param", async () => {
    const res = await get("query").query({ a: 4 });
    expect(res).toMatchObject({ a: 4 });
  });
  test("Get with two query params", async () => {
    const res = await get("query").query({ a: 4, b: "abc" });
    expect(res).toMatchObject({ a: 4, b: "abc" });
  });
  test("Check encoding of arrays", async () => {
    const res = await get("query").query({ arst: [4, 5, 7] });
    expect(res).toMatchObject({ arst: [4, 5, 7] });
  });
  test("Check encoding of certain characters", async () => {
    const res = await get("query").query({ b: "?a=a&b=" });
    expect(res).toMatchObject({ b: "?a=a&b=" });
  });
});

describe("Body params", () => {
  test("Post with a body param", async () => {
    const res = await post("body").data({ a: 4 });
    expect(res).toMatchObject({ a: 4 });
  });
  test("Post with two body params", async () => {
    const res = await post("body").data({ a: 4, b: "abc" });
    expect(res).toMatchObject({ a: 4, b: "abc" });
  });
  test("Check encoding of arrays", async () => {
    const res = await post("body").data({ arst: [4, 5, 7] });
    expect(res).toMatchObject({ arst: [4, 5, 7] });
  });
  test("Check encoding of certain characters", async () => {
    const res = await post("body").data({ b: "?a=a&b=" });
    expect(res).toMatchObject({ b: "?a=a&b=" });
  });
  test("Check that get throws error on data", async () => {
    expect(() => get("body").data({ b: "?a=a&b=" })).toThrow(
      "GET Request cannot take data"
    );
  });
});

describe("Error catchers", () => {
  test("Get an 400", async () => {
    const mockOn = jest.fn((e) => {});

    await expect(get("nope400").on(400, mockOn)).rejects.toBe(false);

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0][0]).toMatchObject({
      error: "This is wrong, fool",
    });
  });

  test("Get an 400 with specific code", async () => {
    const mockOn = jest.fn((e) => {});
    const mockOn2 = jest.fn((e) => {});
    await expect(
      get("nope400")
        .query({ error: "My specific error" })
        .on({ status: 400, error: "My specific error" }, mockOn)
        .on(400, mockOn2)
    ).rejects.toBe(false);

    expect(mockOn2.mock.calls.length).toBe(0);

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0][0]).toMatchObject({
      error: "My specific error",
    });
  });

  test("Middleware catcher", async () => {
    const consoleMock = jest.spyOn(console, "log");
    await expect(get("nope400").query({ status: 401 })).rejects.toBe(false);

    expect(consoleMock.mock.calls.length).toBe(2);
    expect(consoleMock.mock.calls[0][0]).toBe("online");
    expect(consoleMock.mock.calls[1][0]).toBe("logout");
    consoleMock.mockRestore();
  });
  test("Middleware catcher should preserve order", async () => {
    const consoleMock = jest.spyOn(console, "log");
    await expect(
      get("nope400").query({ status: 401, error: "Token invalid" })
    ).rejects.toBe(false);

    expect(consoleMock.mock.calls.length).toBe(2);
    expect(consoleMock.mock.calls[0][0]).toBe("online");
    expect(consoleMock.mock.calls[1][0]).toBe("tokenInv");
    consoleMock.mockRestore();
  });
  test("Middleware catcher should run after manual catchers", async () => {
    const consoleMock = jest.spyOn(console, "log");
    const mockOn = jest.fn((e) => {});
    await expect(
      get("nope400").query({ status: 401 }).on(401, mockOn)
    ).rejects.toBe(false);

    expect(consoleMock.mock.calls.length).toBe(1);
    expect(consoleMock.mock.calls[0][0]).toBe("online");

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0][0]).toMatchObject({
      error: "This is wrong, fool",
    });

    consoleMock.mockRestore();
  });
});

describe("Test offline behavior", () => {
  test("Online detected", async () => {
    const consoleMock = jest.spyOn(console, "log");

    await expect(await get("get")).toBe("ok get");

    expect(consoleMock.mock.calls.length).toBe(1);
    expect(consoleMock.mock.calls[0][0]).toBe("online");
    consoleMock.mockRestore();
  });

  test("Middleware catcher", async () => {
    server.close();
    server = null;
    const consoleMock = jest.spyOn(console, "log");
    await expect(get("nope400").query({ status: 401 })).rejects.toBe(false);

    expect(consoleMock.mock.calls.length).toBe(1);
    expect(consoleMock.mock.calls[0][0]).toBe("offline");
    consoleMock.mockRestore();
  });
});
