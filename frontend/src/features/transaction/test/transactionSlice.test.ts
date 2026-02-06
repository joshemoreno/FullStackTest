/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import reducer, {
  fetchTransaction,
  setTxId,
  setPollPath,
  resetTransaction,
} from "../transactionSlice";

import { transactionApi } from "../transactionApi";

vi.mock("../transactionApi", () => ({
  transactionApi: {
    getById: vi.fn(),
  },
}));

const rootReducer = combineReducers({ transaction: reducer });
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

describe("transactionSlice - reducers", () => {
  test("setTxId: setea txId", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(s1, setTxId("tx_1"));
    expect(s2.txId).toBe("tx_1");

    const s3 = reducer(s2, setTxId(null));
    expect(s3.txId).toBeNull();
  });

  test("setPollPath: setea pollPath", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(s1, setPollPath("/transactions/tx_1"));
    expect(s2.pollPath).toBe("/transactions/tx_1");

    const s3 = reducer(s2, setPollPath(null));
    expect(s3.pollPath).toBeNull();
  });

  test("resetTransaction: vuelve al initialState", () => {
    const s1 = reducer(undefined, { type: "init" });
    const dirty = {
      ...s1,
      txId: "tx_x",
      pollPath: "/x",
      status: "APPROVED",
      detail: { txId: "tx_x", status: "APPROVED" } as any,
      loading: true,
      error: "boom",
    };

    const cleared = reducer(dirty as any, resetTransaction());
    expect(cleared).toEqual(s1); 
  });
});

describe("transactionSlice - fetchTransaction thunk", () => {
  test("pending: loading=true y error=null", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer({ ...s1, error: "prev" }, fetchTransaction.pending("", "tx_1"));

    expect(s2.loading).toBe(true);
    expect(s2.error).toBeNull();
  });

  test("fulfilled: setea detail, status y txId desde payload", async () => {
    const store = makeStore();

    const detail = {
      txId: "tx_123",
      status: "APPROVED",
    } as any;

    vi.mocked(transactionApi.getById).mockResolvedValue(detail);

    const promise = store.dispatch(fetchTransaction("tx_123"));

    expect(store.getState().transaction.loading).toBe(true);

    await promise;

    const st = store.getState().transaction;
    expect(st.loading).toBe(false);
    expect(st.error).toBeNull();
    expect(st.detail).toEqual(detail);
    expect(st.status).toBe("APPROVED");
    expect(st.txId).toBe("tx_123");
  });

  test("rejected: setea error desde message", async () => {
    const store = makeStore();

    vi.mocked(transactionApi.getById).mockRejectedValue(new Error("Not found"));

    await store.dispatch(fetchTransaction("tx_x"));

    const st = store.getState().transaction;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Not found");
  });

  test("rejected: sin message usa fallback 'Failed to fetch transaction'", async () => {
    const store = makeStore();

    vi.mocked(transactionApi.getById).mockRejectedValue({});

    await store.dispatch(fetchTransaction("tx_x"));

    const st = store.getState().transaction;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Failed to fetch transaction");
  });
});
