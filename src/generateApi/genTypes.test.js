import { createTypeFsFromType, genType } from "./genTypes";
import { prettify } from "./prettify";

describe("createTypeFsFromType", () => {
  it("should return correct type", async () => {
    expect(
      prettify(
        createTypeFsFromType({
          status: 200,
          type: "object",
          keys: {
            id: {
              type: "id",
              description: "desc",
              //              title: "thetitle",
              auto: true,
              key: true,
              readOnly: true,
            },
            name: {
              type: "string",
              description: "test desc",
              optional: true,
              mapped: "abc",
            },
            legalInfo: {
              type: "object",
              keys: {
                UstId: { type: "int" },
                entityName: { type: "bool" },
              },
            },
            defaultLanguage: {
              type: "oneOf",
              alternatives: [{ value: "de" }, { value: "en" }],
              derived: "de",
            },
            "allowed.OrderStates": {
              type: "object",
              values: {
                type: "object",
                keys: {
                  order: {
                    type: "object",
                    optional: true,
                    keys: {
                      channel: {
                        type: "array",
                        items: {
                          type: "oneOf",
                          alternatives: [
                            { value: "websocket" },
                            { value: "pushNotification" },
                            { value: "email" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      )
    ).toBe(
      //              .title("thetitle")
      prettify(`
schema.obj({
  id: schema.int().semantic("id")
              .description("desc")
              .auto()
              .key()
              .readOnly(),
  name: schema.string().optional().description("test desc").mapped("abc"),
  legalInfo: schema.obj({
    UstId: schema.int(),
    entityName: schema.boolean(),
  }),
  defaultLanguage: schema.oneOf([schema.value("de"), schema.value("en")]).derived(undefined),
  "allowed.OrderStates": schema.objValues(
    schema.obj({
      order: schema
        .obj({
          channel: schema.array(
            schema.oneOf([
              schema.value("websocket"),
              schema.value("pushNotification"),
              schema.value("email"),
            ])
          ),
        })
        .optional(),
    })
  ),
});
      `)
    );
  });
});

describe("genType", () => {
  it("should gen correct type code", async () => {
    expect(
      prettify(
        genType("testParams", {
          type: "object",
          keys: {
            venueId: { type: "id" },
            orderId: { type: "id" },
            paymentId: { type: "id" },
          },
        })
      )
    ).toBe(
      prettify(`
      export const testParamsSchema = schema.obj({
        venueId: schema.int().semantic("id"),
        orderId: schema.int().semantic("id"),
        paymentId: schema.int().semantic("id"),
      });
export type TestParams = schema.InferType<
  typeof testParamsSchema
>;`)
    );
  });
});
