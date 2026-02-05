import { http } from "../../services/http";
import type { TransactionDetail } from "./types";

export const transactionApi = {
  getById: (txId: string) => http<TransactionDetail>(`/transactions/${txId}`),
};
