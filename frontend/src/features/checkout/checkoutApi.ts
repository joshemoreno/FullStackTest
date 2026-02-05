import { http } from "../../services/http";
import type {
  InitCheckoutRequest,
  InitCheckoutResponse,
  PayCheckoutRequest,
  PayCheckoutResponse,
} from "./types";

export const checkoutApi = {
  init: (payload: InitCheckoutRequest) =>
    http<InitCheckoutResponse>("/checkout/init", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  pay: (payload: PayCheckoutRequest) =>
    http<PayCheckoutResponse>("/checkout/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
