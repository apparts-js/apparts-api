/* eslint-env node */

const express = require("express");
const {
  HttpError,
  httpErrorSchema,
  prepare,
  validJwt,
} = require("@apparts/prep");
const JWT = require("jsonwebtoken");
const app = express();
const types = require("@apparts/types");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get(
  "/v/1/get",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok get";
    }
  )
);

app.post(
  "/v/1/post",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok post";
    }
  )
);

app.put(
  "/v/1/put",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok put";
    }
  )
);

app.patch(
  "/v/1/patch",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok patch";
    }
  )
);

app.delete(
  "/v/1/del",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok del";
    }
  )
);

app.get(
  "/v/2/get",
  prepare(
    {
      receives: {},
      hasAccess: () => {},
    },
    async () => {
      return "ok get2";
    }
  )
);

app.get(
  "/v/1/query",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        query: types.obj({
          a: types.int().optional(true),
          b: types.string().optional(true),
          arst: types.array(types.any()).optional(true),
        }),
      },
    },
    async ({ query }) => {
      return query;
    }
  )
);

app.post(
  "/v/1/body",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        body: types.obj({
          a: types.int().optional(true),
          b: types.string().optional(true),
          arst: types.array(types.any()).optional(true),
        }),
      },
    },
    async ({ body }) => {
      return body;
    }
  )
);

app.get(
  "/v/1/nope400",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        query: types.obj({
          error: types.string().default("This is wrong, fool"),
          status: types.int().default(400),
        }),
      },
    },
    async ({ query: { error, status } }) => {
      return new HttpError(status, error);
    }
  )
);

app.get(
  "/v/1/params/:p1/:p2/:p3/a",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        params: types.obj({
          p1: types.string(),
          p2: types.string(),
          p3: types.string(),
        }),
      },
    },
    async ({ params: { p1, p2, p3 } }) => {
      return { p1, p2, p3 };
    }
  )
);

app.get(
  "/v/1/arrparams/:p1",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        params: types.obj({
          p1: types.array(types.any()),
        }),
      },
    },
    async ({ params: { p1 } }) => {
      return { p1 };
    }
  )
);

app.get(
  "/v/1/jwted",
  prepare(
    {
      hasAccess: validJwt("abc"),
      receives: {},
    },
    async () => {
      return "ok";
    }
  )
);

app.get(
  "/v/1/apiToken",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        query: types.obj({
          expiresIn: types.string().default("100000"),
        }),
      },
    },
    async ({ query: { expiresIn } }) => {
      return JWT.sign({ action: "login" }, "abc", { expiresIn });
    }
  )
);

app.post(
  "/v/1/user/venue/:venueId/order/:orderId/payment/:paymentId/receipt",
  prepare(
    {
      hasAccess: () => {},
      receives: {
        params: types.obj({
          venueId: types.int(),
          orderId: types.int(),
          paymentId: types.int(),
        }),
      },
      returns: [
        types.value("ok"),
        types.obj({
          venueId: types.int(),
          orderId: types.int(),
          paymentId: types.int(),
        }),
        httpErrorSchema(400, "Something went wrong"),
      ],
    },
    async ({ params: { venueId, orderId, paymentId } }) => {
      if (venueId >= 10) {
        return new HttpError(400, "Something went wrong");
      }
      if (orderId >= 10) {
        return "ok";
      }
      return { venueId, orderId, paymentId };
    }
  )
);

let tries = 0;
app.get(
  "/v/1/retryme",
  prepare(
    {
      hasAccess: () => {},
      receives: {},
    },
    async () => {
      tries++;
      if (tries < 3) {
        return new HttpError(500, "Nope, try again");
      }
      tries = 0;
      return "ok";
    }
  )
);

module.exports = { app };
