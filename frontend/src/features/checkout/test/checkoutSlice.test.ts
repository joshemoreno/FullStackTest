/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import reducer, {
  openModal,
  closeModal,
  setQuantity,
  setCustomer,
  setDelivery,
  setCard,
  clearCheckout,
  initCheckout,
  payCheckout,
} from "../checkoutSlice";

import { checkoutApi } from "../checkoutApi";

vi.mock("../checkoutApi", () => ({
  checkoutApi: {
    init: vi.fn(),
    pay: vi.fn(),
  },
}));

const rootReducer = combineReducers({ checkout: reducer });

type RootState = ReturnType<typeof rootReducer>;

function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as RootState,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkoutSlice - reducers", () => {
  test("openModal: abre modal y limpia error", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer({ ...s1, error: "boom" }, openModal());

    expect(s2.modalOpen).toBe(true);
    expect(s2.error).toBeNull();
  });

  test("closeModal: cierra modal", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer({ ...s1, modalOpen: true }, closeModal());

    expect(s2.modalOpen).toBe(false);
  });

  test("setQuantity: cambia quantity", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(s1, setQuantity(3));

    expect(s2.quantity).toBe(3);
  });

  test("setCustomer: merge parcial", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(s1, setCustomer({ fullName: "Jose", email: "j@a.com" }));

    expect(s2.customer.fullName).toBe("Jose");
    expect(s2.customer.email).toBe("j@a.com");
    expect(s2.customer.legalIdType).toBe("CC");
  });

  test("setDelivery: merge parcial", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(
      s1,
      setDelivery({ addressLine1: "Calle 1", city: "Cali" })
    );

    expect(s2.delivery.addressLine1).toBe("Calle 1");
    expect(s2.delivery.city).toBe("Cali");
    expect(s2.delivery.country).toBe("CO");
  });

  test("setCard: merge parcial", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(
      s1,
      setCard({ number: "4111111111111111", cvc: "123" })
    );

    expect(s2.card.number).toBe("4111111111111111");
    expect(s2.card.cvc).toBe("123");
    expect(s2.card.installments).toBe(1);
  });

  test("clearCheckout: vuelve a initialState", () => {
    const s1 = reducer(undefined, { type: "init" });
    const dirty = reducer(
      { ...s1, modalOpen: true, quantity: 5, error: "x" },
      setCustomer({ fullName: "Jose" })
    );

    const cleared = reducer(dirty, clearCheckout());

    expect(cleared.modalOpen).toBe(false);
    expect(cleared.quantity).toBe(1);
    expect(cleared.error).toBeNull();
    expect(cleared.customer.fullName).toBe("");
  });
});

describe("checkoutSlice - thunks", () => {
  test("initCheckout: pending -> fulfilled setea loading=false, summary e initTxId", async () => {
    const store = makeStore();

    const mockResp = {
      txId: "tx_init_1",
      summary: {
        amount_in_cents: 1000,
        base_fee_in_cents: 100,
        delivery_fee_in_cents: 200,
        total_in_cents: 1300,
        currency: "COP",
      },
    };

    vi.mocked(checkoutApi.init).mockResolvedValue(mockResp as any);

    const promise = store.dispatch(
      initCheckout({
        productId: "p1",
        quantity: 1,
        customer: store.getState().checkout.customer,
        delivery: store.getState().checkout.delivery,
      } as any)
    );

    expect(store.getState().checkout.loading).toBe(true);

    await promise;

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBeNull();
    expect(st.initTxId).toBe("tx_init_1");
    expect(st.summary).toEqual(mockResp.summary);
  });

  test("initCheckout: rejected setea error y loading=false", async () => {
    const store = makeStore();

    vi.mocked(checkoutApi.init).mockRejectedValue(new Error("Init boom"));

    await store.dispatch(
      initCheckout({
        productId: "p1",
        quantity: 1,
        customer: store.getState().checkout.customer,
        delivery: store.getState().checkout.delivery,
      } as any)
    );

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Init boom");
  });

  test("initCheckout: rejected sin message usa fallback 'Init failed'", async () => {
    const store = makeStore();

    vi.mocked(checkoutApi.init).mockRejectedValue({});

    await store.dispatch(
      initCheckout({
        productId: "p1",
        quantity: 1,
        customer: store.getState().checkout.customer,
        delivery: store.getState().checkout.delivery,
      } as any)
    );

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Init failed");
  });

  test("payCheckout: pending -> fulfilled apaga loading y no setea error", async () => {
    const store = makeStore({
      checkout: {
        ...reducer(undefined, { type: "init" }),
        error: "prev",
      },
    });

    vi.mocked(checkoutApi.pay).mockResolvedValue({ txId: "tx_paid_1" } as any);

    const promise = store.dispatch(
      payCheckout({
        txId: "tx_init_1",
        card_holder: "Jose",
        number: "4111111111111111",
        exp_month: "12",
        exp_year: "30",
        cvc: "123",
        installments: 1,
      } as any)
    );

    expect(store.getState().checkout.loading).toBe(true);

    await promise;

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBeNull();
  });

  test("payCheckout: rejected setea error y loading=false", async () => {
    const store = makeStore();

    vi.mocked(checkoutApi.pay).mockRejectedValue(new Error("Pay boom"));

    await store.dispatch(
      payCheckout({
        txId: "tx_init_1",
        card_holder: "Jose",
        number: "4111111111111111",
        exp_month: "12",
        exp_year: "30",
        cvc: "123",
        installments: 1,
      } as any)
    );

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Pay boom");
  });

  test("payCheckout: rejected sin message usa fallback 'Pay failed'", async () => {
    const store = makeStore();

    vi.mocked(checkoutApi.pay).mockRejectedValue({});

    await store.dispatch(
      payCheckout({
        txId: "tx_init_1",
        card_holder: "Jose",
        number: "4111111111111111",
        exp_month: "12",
        exp_year: "30",
        cvc: "123",
        installments: 1,
      } as any)
    );

    const st = store.getState().checkout;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Pay failed");
  });
});
