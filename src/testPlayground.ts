import { schema } from "@apparts/types";
import { ApiType } from "./";
import { getApi } from "./testApi";

const postUserVenueOrderPaymentReceiptParamsSchema = schema.obj({
  venueId: schema.int().semantic("id"),
  orderId: schema.int().semantic("id"),
  paymentId: schema.int().semantic("id"),
});

type PostUserVenueOrderPaymentReceiptParams = schema.InferType<
  typeof postUserVenueOrderPaymentReceiptParamsSchema
>;

type PostUserVenueOrderPaymentReceiptReturns =
  | {
      venueId: number;
      orderId: number;
      paymentId: number;
    }
  | "ok";

type PostUserVenueOrderPaymentReceipt404Response = {
  error: "Something went wrong";
};

const createApi = (api: ApiType) => {
  return {
    //    user.venue.order.payment.postReceipt()
    user: {
      venue: {
        order: {
          payment: {
            receipt: {
              post: ({
                params: { venueId, orderId, paymentId },
              }: {
                params: PostUserVenueOrderPaymentReceiptParams;
              }) => {
                const request =
                  api.post<PostUserVenueOrderPaymentReceiptReturns>(
                    "user/venue/$1/order/$2/payment/$3/receipt",
                    [venueId, orderId, paymentId]
                  );
                const enrichedRequest = Object.assign(request, {
                  on400: (
                    fn: (p: PostUserVenueOrderPaymentReceipt404Response) => void
                  ) => {
                    request.on<PostUserVenueOrderPaymentReceipt404Response>(
                      400,
                      (p) => {
                        fn(p);
                      }
                    );
                    return enrichedRequest;
                  },
                  on400SpecificError: (
                    fn: (p: PostUserVenueOrderPaymentReceipt404Response) => void
                  ) => {
                    request.on<PostUserVenueOrderPaymentReceipt404Response>(
                      { status: 400, error: "specific" },
                      (p) => {
                        fn(p);
                      }
                    );
                    return enrichedRequest;
                  },
                });
                return enrichedRequest;
              },
            },
          },
        },
      },
    },
  };
};

export const api = createApi(getApi(3001));
