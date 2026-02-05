/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { productApi } from "./productApi";
import type { Product } from "./types";

type State = {
  items: Product[];
  selectedProductId: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  items: [],
  selectedProductId: null,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk("product/fetch", async () => {
  return await productApi.getProducts();
});

const slice = createSlice({
  name: "product",
  initialState,
  reducers: {
    selectProduct(state, action: { payload: string }) {
      state.selectedProductId = action.payload;
    },
    clearProductError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchProducts.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchProducts.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload;
      if (!s.selectedProductId && a.payload[0]?.productId) {
        s.selectedProductId = a.payload[0].productId;
      }
    });
    b.addCase(fetchProducts.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to load products";
    });
  },
});

export const { selectProduct, clearProductError } = slice.actions;
export default slice.reducer;

export const selectSelectedProduct = (state: any) => {
  const id = state.product.selectedProductId;
  return state.product.items.find((p: Product) => p.productId === id) ?? null;
};
