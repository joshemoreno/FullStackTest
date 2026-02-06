/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

type UiState = {
  pendingCount: number;
};

const initialState: UiState = { pendingCount: 0 };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    startLoading(state) {
      state.pendingCount += 1;
    },
    stopLoading(state) {
      state.pendingCount = Math.max(0, state.pendingCount - 1);
    },
    resetLoading(state) {
      state.pendingCount = 0;
    },
  },
});

export const { startLoading, stopLoading, resetLoading } = uiSlice.actions;
export default uiSlice.reducer;

export const selectIsLoading = (s: any) => s.ui.pendingCount > 0;
