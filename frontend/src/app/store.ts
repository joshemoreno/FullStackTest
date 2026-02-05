import { configureStore } from "@reduxjs/toolkit";
import productReducer from "../features/product/productSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import transactionReducer from "../features/transaction/transactionSlice";
import { loadState, saveState } from "../services/storage";

const persisted = loadState();

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
  },
  preloadedState: {
    checkout: persisted?.checkout,
    transaction: persisted?.transaction,
  },
});

store.subscribe(() => {
  const s = store.getState();
  saveState({
    checkout: s.checkout,
    transaction: s.transaction,
  });
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
