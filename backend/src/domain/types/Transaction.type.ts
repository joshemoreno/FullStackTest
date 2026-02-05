export type Transaction = {
  txId: string;
  productId: string;
  quantity: number;
  amount_in_cents: number;
  base_fee_in_cents: number;
  delivery_fee_in_cents: number;
  total_in_cents: number;
  currency: string;
  customer: Customer;
  delivery: Delivery;
  status: TxStatus;
  apipay?: {
    apiPayTxId?: string;
    referenceTx?: string;
    lastError?: string;
    statusMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
  stockDiscounted?: boolean;
};

export type Customer = {
  fullName: string;
  email: string;
  phone: string;
  legalId?: string;
  legalIdType?: string;
};

export type Delivery = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  country?: string;
  notes?: string;
};

export type TxStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
