/// <reference types="vitest/globals" />

import { describe, test, expect, vi } from "vitest";
import { checkoutApi } from "../checkoutApi";
import { http } from "../../../services/http";
import type {
  InitCheckoutRequest,
  InitCheckoutResponse,
  PayCheckoutRequest,
  PayCheckoutResponse,
} from "../types";


vi.mock("../../../services/http", () => ({
  http: vi.fn(),
}));

describe("checkoutApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("init", () => {
    test("llama http con la URL y opciones correctas y retorna la respuesta", async () => {
      const payload: InitCheckoutRequest = {
        productId: "prod_1",
        quantity: 2,
        customer: {
          fullName: "Jose Moreno",
          email: "jose@test.com",
          phone: "3000000000",
          legalId: "123456",
          legalIdType: "CC",
        },
        delivery: {
          addressLine1: "Calle 1",
          addressLine2: "Apto 2",
          city: "Cali",
          region: "Valle",
          country: "Colombia",
        },
      };

      const response: InitCheckoutResponse = {
        txId: "tx_init_123",
        status: "APPROVED",
        summary: {
            amount_in_cents:1000,
            base_fee_in_cents:1000,
            currency:"COP",
            delivery_fee_in_cents:1000,
            total_in_cents:1000
        }
      };

       vi.mocked(http).mockResolvedValue(response);

      const result = await checkoutApi.init(payload);

      expect(http).toHaveBeenCalledTimes(1);
      expect(http).toHaveBeenCalledWith("/checkout/init", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      expect(result).toEqual(response);
    });
  });

  describe("pay", () => {
    test("llama http con la URL y opciones correctas y retorna la respuesta", async () => {
      const payload: PayCheckoutRequest = {
        txId: "tx_init_123",
        card_holder: "Jose Moreno",
        number: "4111111111111111",
        exp_month: "12",
        exp_year: "30",
        cvc: "123",
        installments:1,
      };

      const response: PayCheckoutResponse = {
        txId: "tx_paid_456",
        status: "APPROVED",
        apipay: { apiPayTxId: 'string', reference: 'string' },
        next: {
          poll: "/transactions/tx_paid_456",
        },
      };

     vi.mocked(http).mockResolvedValue(response);

      const result = await checkoutApi.pay(payload);

      expect(http).toHaveBeenCalledTimes(1);
      expect(http).toHaveBeenCalledWith("/checkout/pay", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      expect(result).toEqual(response);
    });
  });
});
