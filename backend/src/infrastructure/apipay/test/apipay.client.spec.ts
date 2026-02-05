import axios from 'axios';
import { ApiPayClient } from '../apipay.client';

jest.mock('../../../config/env', () => ({
  env: {
    APIPAY_BASE_URL: 'https://apipay.test',
    APIPAY_PUBLIC_KEY: 'pub_test_123',
    APIPAY_PRIVATE_KEY: 'priv_test_456',
  },
}));

jest.mock('axios');

describe('ApiPayClient', () => {
  const httpMock = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    (axios.create as unknown as jest.Mock).mockReturnValue(httpMock);
  });

  it('debe crear axios instance con baseURL y timeout', () => {
    const client = new ApiPayClient();

    expect(axios.create).toHaveBeenCalledTimes(1);
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://apipay.test',
      timeout: 15000,
    });
  });

  it('getAcceptanceTokens(): debe llamar GET /merchants/:publicKey y mapear tokens/permalinks', async () => {
    const client = new ApiPayClient();

    httpMock.get.mockResolvedValueOnce({
      data: {
        data: {
          presigned_acceptance: {
            acceptance_token: 'acc_token',
            permalink: 'https://terms',
          },
          presigned_personal_data_auth: {
            acceptance_token: 'personal_token',
            permalink: 'https://personal-data',
          },
        },
      },
    });

    const result = await client.getAcceptanceTokens();

    expect(httpMock.get).toHaveBeenCalledTimes(1);
    expect(httpMock.get).toHaveBeenCalledWith('/merchants/pub_test_123');

    expect(result).toEqual({
      acceptance_token: 'acc_token',
      accept_personal_auth: 'personal_token',
      permalinks: {
        terms: 'https://terms',
        personalData: 'https://personal-data',
      },
    });
  });

  it('tokenizeCard(): debe hacer POST /tokens/cards con Bearer PUBLIC KEY y retornar data.id', async () => {
    const client = new ApiPayClient();

    httpMock.post.mockResolvedValueOnce({
      data: {
        data: { id: 'card_tok_1' },
      },
    });

    const input = {
      number: '4242424242424242',
      exp_month: '06',
      exp_year: '29',
      cvc: '123',
      card_holder: 'Jose Moreno',
    };

    const result = await client.tokenizeCard(input);

    expect(httpMock.post).toHaveBeenCalledTimes(1);
    expect(httpMock.post).toHaveBeenCalledWith('/tokens/cards', input, {
      headers: { Authorization: 'Bearer pub_test_123' },
    });

    expect(result).toBe('card_tok_1');
  });

  it('createCardTransaction(): debe construir payload, usar Bearer PRIVATE KEY y retornar res.data.data', async () => {
    const client = new ApiPayClient();

    httpMock.post.mockResolvedValueOnce({
      data: {
        data: { id: 'pay_1', status: 'PENDING', status_message: 'Created' },
      },
    });

    const input = {
      acceptance_token: 'acc',
      accept_personal_auth: 'auth',
      amount_in_cents: 12500,
      currency: 'COP',
      customer_email: 'jose@test.com',
      reference: 'TX-tx-1',
      signature: 'sig',
      cardToken: 'card_tok_1',
      ip: '127.0.0.1',
    };

    const result = await client.createCardTransaction(input);

    const expectedPayload = {
      acceptance_token: 'acc',
      accept_personal_auth: 'auth',
      amount_in_cents: 12500,
      currency: 'COP',
      customer_email: 'jose@test.com',
      reference: 'TX-tx-1',
      signature: 'sig',
      payment_method: {
        type: 'CARD',
        token: 'card_tok_1',
        installments: 1,
      },
      ip: '127.0.0.1',
    };

    expect(httpMock.post).toHaveBeenCalledTimes(1);
    expect(httpMock.post).toHaveBeenCalledWith('/transactions', expectedPayload, {
      headers: { Authorization: 'Bearer priv_test_456' },
    });

    expect(result).toEqual({ id: 'pay_1', status: 'PENDING', status_message: 'Created' });
  });

  it('createCardTransaction(): si viene installments lo debe usar en payload', async () => {
    const client = new ApiPayClient();

    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 'pay_2' } },
    });

    await client.createCardTransaction({
      acceptance_token: 'acc',
      accept_personal_auth: 'auth',
      amount_in_cents: 1000,
      currency: 'COP',
      customer_email: 'a@b.com',
      reference: 'TX-x',
      signature: 'sig',
      cardToken: 'card_tok',
      installments: 3,
    });

    expect(httpMock.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        payment_method: expect.objectContaining({ installments: 3 }),
      }),
      expect.any(Object)
    );
  });

  it('createCardTransaction(): si falla debe lanzar Error con JSON.stringify(error.response.data)', async () => {
    const client = new ApiPayClient();

    httpMock.post.mockRejectedValueOnce({
      response: { data: { error: 'invalid' } },
    });

    await expect(
      client.createCardTransaction({
        acceptance_token: 'acc',
        accept_personal_auth: 'auth',
        amount_in_cents: 1000,
        currency: 'COP',
        customer_email: 'a@b.com',
        reference: 'TX-x',
        signature: 'sig',
        cardToken: 'card_tok',
      })
    ).rejects.toThrow(JSON.stringify({ error: 'invalid' }));
  });

  it('getTransaction(): debe hacer GET /transactions/:id con Bearer PRIVATE KEY y retornar res.data.data', async () => {
    const client = new ApiPayClient();

    httpMock.get.mockResolvedValueOnce({
      data: { data: { id: 'pay-1', status: 'APPROVED', status_message: 'Approved' } },
    });

    const result = await client.getTransaction('pay-1');

    expect(httpMock.get).toHaveBeenCalledTimes(1);
    expect(httpMock.get).toHaveBeenCalledWith('/transactions/pay-1', {
      headers: { Authorization: 'Bearer priv_test_456' },
    });

    expect(result).toEqual({ id: 'pay-1', status: 'APPROVED', status_message: 'Approved' });
  });
});
