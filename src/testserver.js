const { HttpError } = require("@apparts/error");
const express = require("express");
const { preparator, prepauthTokenJWT } = require("@apparts/types");
const JWT = require("jsonwebtoken");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get(
  "/v/1/get",
  preparator({}, async () => {
    return "ok get";
  })
);

app.post(
  "/v/1/post",
  preparator({}, async () => {
    return "ok post";
  })
);

app.put(
  "/v/1/put",
  preparator({}, async () => {
    return "ok put";
  })
);

app.patch(
  "/v/1/patch",
  preparator({}, async () => {
    return "ok patch";
  })
);

app.delete(
  "/v/1/del",
  preparator({}, async () => {
    return "ok del";
  })
);

app.get(
  "/v/2/get",
  preparator({}, async () => {
    return "ok get2";
  })
);

app.get(
  "/v/1/query",
  preparator(
    {
      query: {
        a: { type: "int", optional: true },
        b: { type: "string", optional: true },
        arst: { type: "array", optional: true, items: { type: "/" } },
      },
    },
    async ({ query }) => {
      return query;
    }
  )
);

app.post(
  "/v/1/body",
  preparator(
    {
      body: {
        a: { type: "int", optional: true },
        b: { type: "string", optional: true },
        arst: { type: "array", optional: true, items: { type: "/" } },
      },
    },
    async ({ body }) => {
      return body;
    }
  )
);

app.get(
  "/v/1/nope400",
  preparator(
    {
      query: {
        error: {
          type: "string",
          optional: true,
          default: "This is wrong, fool",
        },
        status: { type: "int", optional: true, default: 400 },
      },
    },
    async ({ query: { error, status } }) => {
      return new HttpError(status, error);
    }
  )
);

app.get(
  "/v/1/params/:p1/:p2/:p3/a",
  preparator(
    {
      params: {
        p1: { type: "string" },
        p2: { type: "string" },
        p3: { type: "string" },
      },
    },
    async ({ params: { p1, p2, p3 } }) => {
      return { p1, p2, p3 };
    }
  )
);

app.get(
  "/v/1/arrparams/:p1",
  preparator(
    {
      params: {
        p1: { type: "array", items: { type: "/" } },
      },
    },
    async ({ params: { p1 } }) => {
      return { p1 };
    }
  )
);

app.get(
  "/v/1/jwted",
  prepauthTokenJWT("abc")({}, async () => {
    return "ok";
  })
);

app.get(
  "/v/1/apiToken",
  preparator(
    {
      query: {
        expiresIn: { type: "string", default: "100000" },
      },
    },
    async ({ query: { expiresIn } }) => {
      return JWT.sign({ action: "login" }, "abc", { expiresIn });
    }
  )
);

module.exports = { app };
