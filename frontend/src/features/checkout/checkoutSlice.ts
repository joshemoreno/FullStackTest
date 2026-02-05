import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { checkoutApi } from "./checkoutApi";
import type {
  Card,
  Customer,
  Delivery,
  InitCheckoutRequest,
  InitCheckoutResponse,
  PayCheckoutRequest,
  PayCheckoutResponse,
  Summary,
} from "./types";

type State = {
  quantity: number;
  customer: Customer;
  delivery: Delivery;
  card: Card;
  summary: Summary | null;
  initTxId: string | null;
  modalOpen: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  quantity: 1,
  customer: {
    fullName: "",
    email: "",
    phone: "",
    legalId: "",
    legalIdType: "CC",
  },
  delivery: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    country: "CO",
    notes: "",
  },
  card: {
    number: "",
    exp_month: "",
    exp_year: "",
    cvc: "",
    card_holder: "",
    installments: 1,
  },
  summary: null,
  initTxId: null,
  modalOpen: false,
  loading: false,
  error: null,
};

export const initCheckout = createAsyncThunk<
  InitCheckoutResponse,
  InitCheckoutRequest
>("checkout/init", async (payload) => {
  return await checkoutApi.init(payload);
});

export const payCheckout = createAsyncThunk<
  PayCheckoutResponse,
  PayCheckoutRequest
>("checkout/pay", async (payload) => {
  return await checkoutApi.pay(payload);
});

const slice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    openModal(s) {
      s.modalOpen = true;
      s.error = null;
    },
    closeModal(s) {
      s.modalOpen = false;
    },
    setQuantity(s, a: { payload: number }) {
      s.quantity = a.payload;
    },
    setCustomer(s, a: { payload: Partial<Customer> }) {
      s.customer = { ...s.customer, ...a.payload };
    },
    setDelivery(s, a: { payload: Partial<Delivery> }) {
      s.delivery = { ...s.delivery, ...a.payload };
    },
    setCard(s, a: { payload: Partial<Card> }) {
      s.card = { ...s.card, ...a.payload };
    },
    clearCheckout(s) {
      Object.assign(s, initialState);
    },
  },
  extraReducers: (b) => {
    b.addCase(initCheckout.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(initCheckout.fulfilled, (s, a) => {
      s.loading = false;
      s.summary = a.payload.summary;
      s.initTxId = a.payload.txId;
    });
    b.addCase(initCheckout.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Init failed";
    });

    b.addCase(payCheckout.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(payCheckout.fulfilled, (s) => {
      s.loading = false;
    });
    b.addCase(payCheckout.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Pay failed";
    });
  },
});

export const {
  openModal,
  closeModal,
  setQuantity,
  setCustomer,
  setDelivery,
  setCard,
  clearCheckout,
} = slice.actions;

export default slice.reducer;
