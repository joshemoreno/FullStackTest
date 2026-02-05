import { ApiPayCreateTxResponse, ApiPayGetTxResponse, ApiPayTokenizeCardResponse } from './../../domain/types/apipay';
import axios from 'axios';
import { env } from '../../config/env';
import { ApiPayMerchantResponse } from '../../domain/types/apipay';

export class ApiPayClient {
  private readonly http = axios.create({
    baseURL: env.APIPAY_BASE_URL,
    timeout: 15000,
  });

  async getAcceptanceTokens(): Promise<{
    acceptance_token: string;
    accept_personal_auth: string;
    permalinks: { terms: string; personalData: string };
  }> {
    // GET /merchants/:merchant_public_key
    const res = await this.http.get<ApiPayMerchantResponse>(
      `/merchants/${env.APIPAY_PUBLIC_KEY}`
    );

    return {
      acceptance_token: res.data.data.presigned_acceptance.acceptance_token,
      accept_personal_auth:
        res.data.data.presigned_personal_data_auth.acceptance_token,
      permalinks: {
        terms: res.data.data.presigned_acceptance.permalink,
        personalData: res.data.data.presigned_personal_data_auth.permalink,
      },
    };
  }

  async tokenizeCard(input: {
    number: string;
    exp_month: string;
    exp_year: string;
    cvc: string;
    card_holder: string;
  }): Promise<string> {
    // POST /v1/tokens/cards con Bearer PUBLIC KEY
    const res = await this.http.post<ApiPayTokenizeCardResponse>(
      '/tokens/cards',
      input,
      { headers: { Authorization: `Bearer ${env.APIPAY_PUBLIC_KEY}` } }
    );
    return res.data.data.id;
  }

  async createCardTransaction(input: {
    acceptance_token: string;
    accept_personal_auth: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    reference: string;
    signature: string;
    cardToken: string;
    installments?: number;
    ip?: string;
  }) {
    // POST /v1/transactions con Bearer PRIVATE KEY
    const payload = {
      acceptance_token: input.acceptance_token,
      accept_personal_auth: input.accept_personal_auth,
      amount_in_cents: input.amount_in_cents,
      currency: input.currency,
      customer_email: input.customer_email,
      reference: input.reference,
      signature: input.signature,
      payment_method: {
        type: 'CARD',
        token: input.cardToken,
        installments: input.installments ?? 1,
      },
      ip: input.ip,
    };

    
    try {
      const res = await this.http.post<ApiPayCreateTxResponse>('/transactions', payload, {
        headers: { Authorization: `Bearer ${env.APIPAY_PRIVATE_KEY}` },
      });
      return res.data.data;
    } catch (error: any) {
      throw new Error(`${JSON.stringify(error.response.data)}` );
    }
  }

  async getTransaction(apipayTxId: string) {
    const res = await this.http.get<ApiPayGetTxResponse>(`/transactions/${apipayTxId}`, {
      headers: { Authorization: `Bearer ${env.APIPAY_PRIVATE_KEY}` },
    });
    return res.data.data;
  }
}
