import { vi } from "vitest";

import { app } from "./testserver";
import { getApi, functions as testapi } from "./testApi";
import { PreparedStatementError } from "./errors";
const { get, put, patch, post, del } = getApi(3000);

let server;
beforeAll(async () => {
  if (server) {
    server.close();
  }
  server = app.listen(3000);
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
    await expect(get("params/$1/$2/$3/a", [])).rejects.toThrow(
      PreparedStatementError
    );
  });
  test("Too many parameters", async () => {
    await expect(get("params/$1/$2/$3/a", [1, 2, 3, 4])).rejects.toThrow(
      PreparedStatementError
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
  test("v(2)", async () => {
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

describe("Error retriers", () => {
  test("Retry a 500", async () => {
    const res = await get("retryme").retryOn(500, 2);
    expect(res).toBe("ok");
  });
  test("Retry a 500, but not often enough", async () => {
    await expect(() => get("retryme").retryOn(500, 1)).rejects.toThrow(Error);
  });
});

describe("Error catchers", () => {
  test("Get an 400", async () => {
    const mockOn = vi.fn(() => {});

    await expect(get("nope400").on(400, mockOn)).rejects.toBe(false);

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0]).toMatchObject([
      {
        error: "This is wrong, fool",
      },
      {},
    ]);
  });

  test("Get an 400 with specific code", async () => {
    const mockOn = vi.fn(() => {});
    const mockOn2 = vi.fn(() => {});
    await expect(
      get("nope400")
        .query({ error: "My specific error" })
        .on({ status: 400, error: "My specific error" }, mockOn)
        .on(400, mockOn2)
    ).rejects.toBe(false);

    expect(mockOn2.mock.calls.length).toBe(0);

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0]).toMatchObject([
      {
        error: "My specific error",
      },
      {},
    ]);
  });

  test("Middleware catcher", async () => {
    const onlineMock = vi.spyOn(testapi, "online");
    const logoutMock = vi.spyOn(testapi, "logout");
    await expect(get("nope400").query({ status: 401 })).rejects.toBe(false);

    expect(onlineMock.mock.calls.length).toBe(1);
    expect(logoutMock.mock.calls.length).toBe(1);
    onlineMock.mockRestore();
    logoutMock.mockRestore();
  });
  test("Middleware catcher should preserve order", async () => {
    const onlineMock = vi.spyOn(testapi, "online");
    const tokenInvMock = vi.spyOn(testapi, "onInvToken");

    await expect(
      get("nope400").query({ status: 401, error: "Token invalid" })
    ).rejects.toBe(false);

    expect(onlineMock.mock.calls.length).toBe(1);
    expect(tokenInvMock.mock.calls.length).toBe(1);
    onlineMock.mockRestore();
    tokenInvMock.mockRestore();
  });
  test("Middleware catcher should run after manual catchers", async () => {
    const onlineMock = vi.spyOn(testapi, "online");
    const mockOn = vi.fn(() => {});
    await expect(
      get("nope400").query({ status: 401 }).on(401, mockOn)
    ).rejects.toBe(false);

    expect(onlineMock.mock.calls.length).toBe(1);

    expect(mockOn.mock.calls.length).toBe(1);
    expect(mockOn.mock.calls[0]).toMatchObject([
      {
        error: "This is wrong, fool",
      },
      {},
    ]);

    onlineMock.mockRestore();
  });
});

describe("Test offline behavior", () => {
  test("Online detected", async () => {
    const onlineMock = vi.spyOn(testapi, "online");

    expect(await get("get")).toBe("ok get");

    expect(onlineMock.mock.calls.length).toBe(1);
    onlineMock.mockRestore();
  });

  test("Middleware catcher", async () => {
    server.close();
    server = null;
    const offlineMock = vi.spyOn(testapi, "onNotOnline");

    await expect(get("nope400").query({ status: 401 })).rejects.toBe(false);

    expect(offlineMock.mock.calls.length).toBe(1);
    offlineMock.mockRestore();
  });
});

describe("Test token invalid recover", () => {
  test("Should recover from 401", async () => {
    if (server) {
      server.close();
    }
    await new Promise((res) => {
      server = app.listen(3000, res);
    });

    let timeMock = vi
      .spyOn(Date, "now")
      .mockImplementation(() => 1614689026333);

    const onlineMock = vi.spyOn(testapi, "online");
    const renewMock = vi.spyOn(testapi, "renewed");

    const jwt = await get<string>("apiToken").query({ expiresIn: "1000" });

    timeMock.mockRestore();
    timeMock = vi
      .spyOn(Date, "now")
      .mockImplementation(() => 1614689026333 + 1000 * 60 * 5);

    await expect(
      get("jwted").authUser({ email: "test", apiToken: jwt })
    ).resolves.toBe("ok");

    expect(onlineMock.mock.calls.length).toBe(3);
    expect(renewMock.mock.calls.length).toBe(1);
    onlineMock.mockRestore();
    renewMock.mockRestore();
    timeMock.mockRestore();
  });
  test("Should reuse token", async () => {
    const onlineMock = vi.spyOn(testapi, "online");
    const timeMock = vi
      .spyOn(Date, "now")
      .mockImplementation(() => 1614689026333 + 1000 * 60 * 6);

    expect(await get("jwted").authUser({ email: "test" })).toBe("ok");
    expect(onlineMock.mock.calls.length).toBe(1);

    onlineMock.mockRestore();
    timeMock.mockRestore();
  });

  test("Should say token issue on token issue", async () => {
    const tokenMock = vi
      .spyOn(testapi, "getToken")
      .mockImplementation(async () => {
        return "nayayayay";
      });

    const onInvTokenMock = vi.spyOn(testapi, "onInvToken");
    await expect(get("jwted").authUser({ email: "boon" })).rejects.toBe(false);

    expect(onInvTokenMock.mock.calls.length).toBe(1);
    onInvTokenMock.mockRestore();
    tokenMock.mockRestore();
  });
  test("Should say offline on offline token recover", async () => {
    const offlineMock = vi.spyOn(testapi, "onNotOnline");
    const tokenMock = vi
      .spyOn(testapi, "getToken")
      .mockImplementation(async () => {
        server.close();
        server = null;
        const token = (await get("apiToken")) as string;
        return token;
      });
    await expect(get("jwted").authUser({ email: "noob" })).rejects.toBe(false);
    expect(offlineMock.mock.calls.length).toBe(1);
    offlineMock.mockRestore();
    tokenMock.mockRestore();
  });
  test("Should say offline on offline call with token", async () => {
    if (server) {
      server.close();
    }
    server = null;
    const offlineMock = vi.spyOn(testapi, "onNotOnline");
    await expect(get("jwted").authUser({ email: "noob" })).rejects.toBe(false);
    expect(offlineMock.mock.calls.length).toBe(1);
    offlineMock.mockRestore();
  });
});
