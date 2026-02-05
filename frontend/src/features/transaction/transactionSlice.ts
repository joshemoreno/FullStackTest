import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { transactionApi } from "./transactionApi";
import type { TransactionDetail, TransactionStatus } from "./types";

type State = {
  txId: string | null;
  pollPath: string | null;
  status: TransactionStatus | null;
  detail: TransactionDetail | null;
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  txId: null,
  pollPath: null,
  status: null,
  detail: null,
  loading: false,
  error: null,
};

export const fetchTransaction = createAsyncThunk<TransactionDetail, string>(
  "transaction/fetch",
  async (txId) => {
    return await transactionApi.getById(txId);
  }
);

const slice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTxId(s, a: { payload: string | null }) {
      s.txId = a.payload;
    },
    setPollPath(s, a: { payload: string | null }) {
      s.pollPath = a.payload;
    },
    resetTransaction() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchTransaction.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchTransaction.fulfilled, (s, a) => {
      s.loading = false;
      s.detail = a.payload;
      s.status = a.payload.status;
      s.txId = a.payload.txId;
    });
    b.addCase(fetchTransaction.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message ?? "Failed to fetch transaction";
    });
  },
});

export const { setTxId, setPollPath, resetTransaction } = slice.actions;
export default slice.reducer;
