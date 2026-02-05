import type { Customer, Delivery } from "../checkout/types";

export type TransactionStatus = "PENDING" | "APPROVED" | "DECLINED" | "ERROR";

export type TransactionDetail = {
  txId: string;
  status: TransactionStatus;

  productId: string;
  quantity: number;

  amount_in_cents: number;
  base_fee_in_cents: number;
  delivery_fee_in_cents: number;
  total_in_cents: number;
  currency: string;

  customer: Customer;
  delivery: Delivery;

  stockDiscounted?: boolean;

  apipay?: {
    apiPayTxId?: string;
    referenceTx?: string;
    statusMessage?: string | null;
    lastError?: string | null;
  };

  createdAt: string;
  updatedAt: string;
};
