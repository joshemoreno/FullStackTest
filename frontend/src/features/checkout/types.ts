export type Customer = {
  fullName: string;
  email: string;
  phone: string;
  legalId: string;
  legalIdType: "CC" | "CE" | "NIT" | string;
};

export type Delivery = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  country: string;
  notes?: string;
};

export type Card = {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  card_holder: string;
  installments: number;
};

export type Summary = {
  amount_in_cents: number;
  base_fee_in_cents: number;
  delivery_fee_in_cents: number;
  total_in_cents: number;
  currency: string;
};

export type InitCheckoutRequest = {
  productId: string;
  quantity: number;
  customer: Customer;
  delivery: Delivery;
};

export type InitCheckoutResponse = {
  txId: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR";
  summary: Summary;
};

export type PayCheckoutRequest = Card & { txId: string };

export type PayCheckoutResponse = {
  txId: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR";
  apipay: { apiPayTxId: string; reference: string };
  next: { poll: string }; 
};
