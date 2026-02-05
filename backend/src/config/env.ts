export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,

  REGION: process.env.REGION ?? 'us-east-1',
  IS_OFFLINE: process.env.IS_OFFLINE === 'true',
  DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT,

  PRODUCTS_TABLE: process.env.PRODUCTS_TABLE ?? 'checkout-app-products-dev',
  TRANSACTIONS_TABLE: process.env.TRANSACTIONS_TABLE ?? 'checkout-app-transactions-dev',

  BASE_FEE_IN_CENTS: Number(process.env.BASE_FEE_IN_CENTS ?? 2500),
  DELIVERY_FEE_IN_CENTS: Number(process.env.DELIVERY_FEE_IN_CENTS ?? 8000),
  CURRENCY: process.env.CURRENCY ?? 'COP',

  APIPAY_BASE_URL: process.env.APIPAY_BASE_URL ?? '',
  APIPAY_PUBLIC_KEY: process.env.APIPAY_PUBLIC_KEY ?? '',
  APIPAY_PRIVATE_KEY: process.env.APIPAY_PRIVATE_KEY ?? '',
  APIPAY_INTEGRITY_SECRET: process.env.APIPAY_INTEGRITY_SECRET ?? '',
};
