/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { describe, test, expect, vi, beforeEach } from "vitest";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import reducer, {
  fetchProducts,
  selectProduct,
  clearProductError,
  selectSelectedProduct,
} from "../productSlice";

import { productApi } from "../productApi";

vi.mock("../productApi", () => ({
  productApi: {
    getProducts: vi.fn(),
  },
}));

const rootReducer = combineReducers({ product: reducer });
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

describe("productSlice - reducers", () => {
  test("selectProduct: setea selectedProductId", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer(s1, selectProduct("p2"));
    expect(s2.selectedProductId).toBe("p2");
  });

  test("clearProductError: limpia error", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer({ ...s1, error: "Boom" }, clearProductError());
    expect(s2.error).toBeNull();
  });
});

describe("productSlice - fetchProducts thunk", () => {
  test("pending: loading=true y error=null", () => {
    const s1 = reducer(undefined, { type: "init" });
    const s2 = reducer({ ...s1, error: "prev" }, fetchProducts.pending("", undefined));
    expect(s2.loading).toBe(true);
    expect(s2.error).toBeNull();
  });

  test("fulfilled: guarda items, loading=false, y selecciona el primer producto si no hay selectedProductId", async () => {
    const store = makeStore();

    const products = [
      { productId: "p1", name: "P1", description: "", imageUrl: "", price_in_cents: 1000, stock: 1, active: true },
      { productId: "p2", name: "P2", description: "", imageUrl: "", price_in_cents: 2000, stock: 2, active: true },
    ] as any[];

    vi.mocked(productApi.getProducts).mockResolvedValue(products);

    const promise = store.dispatch(fetchProducts());

    expect(store.getState().product.loading).toBe(true);

    await promise;

    const st = store.getState().product;
    expect(st.loading).toBe(false);
    expect(st.error).toBeNull();
    expect(st.items).toEqual(products);
    expect(st.selectedProductId).toBe("p1");
  });

  test("fulfilled: NO pisa selectedProductId si ya existe", async () => {
    const store = makeStore({
      product: {
        ...reducer(undefined, { type: "init" }),
        selectedProductId: "p2",
      },
    });

    const products = [
      { productId: "p1", name: "P1", description: "", imageUrl: "", price_in_cents: 1000, stock: 1, active: true },
      { productId: "p2", name: "P2", description: "", imageUrl: "", price_in_cents: 2000, stock: 2, active: true },
    ] as any[];

    vi.mocked(productApi.getProducts).mockResolvedValue(products);

    await store.dispatch(fetchProducts());

    const st = store.getState().product;
    expect(st.selectedProductId).toBe("p2");
  });

  test("fulfilled: si payload viene vacío, no setea selectedProductId", async () => {
    const store = makeStore();

    vi.mocked(productApi.getProducts).mockResolvedValue([]);

    await store.dispatch(fetchProducts());

    const st = store.getState().product;
    expect(st.items).toEqual([]);
    expect(st.selectedProductId).toBeNull();
  });

  test("rejected: setea error desde message", async () => {
    const store = makeStore();

    vi.mocked(productApi.getProducts).mockRejectedValue(new Error("No internet"));

    await store.dispatch(fetchProducts());

    const st = store.getState().product;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("No internet");
  });

  test("rejected: sin message usa fallback 'Failed to load products'", async () => {
    const store = makeStore();

    vi.mocked(productApi.getProducts).mockRejectedValue({});

    await store.dispatch(fetchProducts());

    const st = store.getState().product;
    expect(st.loading).toBe(false);
    expect(st.error).toBe("Failed to load products");
  });
});

describe("selectSelectedProduct selector", () => {
  test("retorna el producto seleccionado", () => {
    const state: any = {
      product: {
        items: [
          { productId: "p1", name: "P1" },
          { productId: "p2", name: "P2" },
        ],
        selectedProductId: "p2",
      },
    };

    expect(selectSelectedProduct(state)?.productId).toBe("p2");
  });

  test("retorna null si no encuentra el id", () => {
    const state: any = {
      product: { items: [{ productId: "p1" }], selectedProductId: "pX" },
    };

    expect(selectSelectedProduct(state)).toBeNull();
  });

  test("retorna null si selectedProductId es null", () => {
    const state: any = {
      product: { items: [{ productId: "p1" }], selectedProductId: null },
    };

    expect(selectSelectedProduct(state)).toBeNull();
  });
});
