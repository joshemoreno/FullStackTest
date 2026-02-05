import { createHash } from 'crypto';

export function ApiPayIntegritySignature(params: {
  reference: string;
  amount_in_cents: number;
  currency: string;
  integritySecret: string;
  expirationTime?: string;
}) {
  const base =
    params.reference +
    String(params.amount_in_cents) +
    params.currency +
    (params.expirationTime ?? '') +
    params.integritySecret;

  return createHash('sha256').update(base, 'utf8').digest('hex');
}
