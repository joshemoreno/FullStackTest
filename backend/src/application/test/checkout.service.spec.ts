import { Test } from '@nestjs/testing';
import { CheckoutService } from '../checkout.service';
import { ProductsRepository } from '../../infrastructure/repository/products.repository';
import { TransactionsRepository } from '../../infrastructure/repository/transactions.repository';
import { ApiPayClient } from '../../infrastructure/apipay/apipay.client';

describe('CheckoutService', () => {
  let service: CheckoutService;

  const productsRepositoryMock = {
    get: jest.fn(),
    getById: jest.fn(),
    decrementStock: jest.fn(),
  };

  const transactionsRepositoryMock = {
    create: jest.fn(),
    get: jest.fn(),
    updateStatus: jest.fn(),
    setApiPayData: jest.fn(),
    setApiPayStatusInfo: jest.fn(),
    finalizeStockDiscountOnce: jest.fn(),
  };

  const apipayMock = {
    getAcceptanceTokens: jest.fn(),
    tokenizeCard: jest.fn(),
    createCardTransaction: jest.fn(),
    getTransaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: ProductsRepository, useValue: productsRepositoryMock },
        { provide: TransactionsRepository, useValue: transactionsRepositoryMock },
        { provide: ApiPayClient, useValue: apipayMock },
      ],
    }).compile();

    service = moduleRef.get(CheckoutService);
  });

  it('init(): si no existe el producto -> error "Product not found"', async () => {
    productsRepositoryMock.get.mockResolvedValueOnce(null);

    await expect(
      service.init({
        productId: 'p-1',
        quantity: 1,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      } as any)
    ).rejects.toMatchObject({ message: 'Product not found' });

    expect(productsRepositoryMock.get).toHaveBeenCalledWith('p-1');
    expect(transactionsRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('init(): si el producto está inactivo -> error "Product not available"', async () => {
    productsRepositoryMock.get.mockResolvedValueOnce({
      productId: 'p-1',
      price_in_cents: 10000,
      stock: 10,
      active: false,
    });

    await expect(
      service.init({
        productId: 'p-1',
        quantity: 1,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      } as any)
    ).rejects.toMatchObject({ message: 'Product not available' });

    expect(transactionsRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('init(): si no hay stock suficiente -> error "Not enough stock"', async () => {
    productsRepositoryMock.get.mockResolvedValueOnce({
      productId: 'p-1',
      price_in_cents: 10000,
      stock: 1,
      active: true,
    });

    await expect(
      service.init({
        productId: 'p-1',
        quantity: 2,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      } as any)
    ).rejects.toMatchObject({ message: 'Not enough stock' });

    expect(transactionsRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('init(): OK -> crea tx PENDING y setea country CO por defecto', async () => {
    productsRepositoryMock.get.mockResolvedValueOnce({
      productId: 'p-1',
      price_in_cents: 10000,
      stock: 5,
      active: true,
    });

    transactionsRepositoryMock.create.mockResolvedValueOnce(undefined);

    const result = await service.init({
      productId: 'p-1',
      quantity: 2,
      customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
      delivery: { addressLine1: 'Calle 1', city: 'Cali' },
    } as any);

    expect(transactionsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p-1',
        quantity: 2,
        status: 'PENDING',
        delivery: expect.objectContaining({ country: 'CO' }),
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        txId: expect.any(String),
        status: 'PENDING',
        summary: expect.objectContaining({
          amount_in_cents: 20000,
          total_in_cents: expect.any(Number),
          currency: expect.any(String),
        }),
      })
    );
  });

  it('pay(): si no existe la tx -> error "Transaction not found"', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce(null);

    await expect(
      service.pay({
        txId: 'tx-404',
        number: '4111111111111111',
        exp_month: '12',
        exp_year: '30',
        cvc: '123',
        card_holder: 'Jose',
      } as any)
    ).rejects.toMatchObject({ message: 'Transaction not found' });

    expect(apipayMock.getAcceptanceTokens).not.toHaveBeenCalled();
  });

  it('pay(): si tx.status != PENDING -> retorna early y NO llama apipay', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'APPROVED',
      apipay: { apiPayTxId: 'pay-1', reference: 'TX-tx-1' },
    });

    const result = await service.pay({ txId: 'tx-1' } as any);

    expect(result).toEqual({
      txId: 'tx-1',
      status: 'APPROVED',
      apipay: { apiPayTxId: 'pay-1', reference: 'TX-tx-1' },
    });

    expect(apipayMock.getAcceptanceTokens).not.toHaveBeenCalled();
    expect(apipayMock.tokenizeCard).not.toHaveBeenCalled();
    expect(apipayMock.createCardTransaction).not.toHaveBeenCalled();
  });

  it('pay(): PENDING -> tokeniza, crea transacción en ApiPay, persiste data y retorna payload esperado', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      total_in_cents: 12500,
      currency: 'COP',
      customer: { email: 'jose@test.com' },
    });

    apipayMock.getAcceptanceTokens.mockResolvedValueOnce({
      acceptance_token: 'acc-1',
      accept_personal_auth: 'auth-1',
    });

    apipayMock.tokenizeCard.mockResolvedValueOnce('card-token-1');

    apipayMock.createCardTransaction.mockResolvedValueOnce({
      id: 'pay-1',
      status_message: 'Created',
    });

    transactionsRepositoryMock.setApiPayData.mockResolvedValueOnce(undefined);
    transactionsRepositoryMock.setApiPayStatusInfo.mockResolvedValueOnce(undefined);

    const dto = {
      txId: 'tx-1',
      number: '4111111111111111',
      exp_month: '12',
      exp_year: '30',
      cvc: '123',
      card_holder: 'Jose',
      installments: 3,
    } as any;

    const result = await service.pay(dto);

    expect(apipayMock.getAcceptanceTokens).toHaveBeenCalled();

    expect(apipayMock.tokenizeCard).toHaveBeenCalledWith(
      expect.objectContaining({
        number: dto.number,
        exp_month: dto.exp_month,
        exp_year: dto.exp_year,
        cvc: dto.cvc,
        card_holder: dto.card_holder,
      })
    );

    expect(apipayMock.createCardTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptance_token: 'acc-1',
        accept_personal_auth: 'auth-1',
        amount_in_cents: 12500,
        currency: 'COP',
        customer_email: 'jose@test.com',
        installments: 3,
        reference: 'TX-tx-1',
        signature: expect.any(String),
        cardToken: 'card-token-1',
      })
    );

    expect(transactionsRepositoryMock.setApiPayData).toHaveBeenCalledWith(
      'tx-1',
      'pay-1',
      'TX-tx-1'
    );
    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenCalledWith(
      'tx-1',
      'Created'
    );

    expect(result).toEqual({
      txId: 'tx-1',
      status: 'PENDING',
      apipay: { apiPayTxId: 'pay-1', reference: 'TX-tx-1' },
      next: { poll: '/transactions/tx-1' },
    });
  });

  it('pay(): si createCardTransaction retorna undefined -> retorna undefined y NO persiste apipay data', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      total_in_cents: 12500,
      currency: 'COP',
      customer: { email: 'jose@test.com' },
    });

    apipayMock.getAcceptanceTokens.mockResolvedValueOnce({
      acceptance_token: 'acc-1',
      accept_personal_auth: 'auth-1',
    });

    apipayMock.tokenizeCard.mockResolvedValueOnce('card-token-1');
    apipayMock.createCardTransaction.mockResolvedValueOnce(undefined);

    const result = await service.pay({
      txId: 'tx-1',
      number: '4111111111111111',
      exp_month: '12',
      exp_year: '30',
      cvc: '123',
      card_holder: 'Jose',
    } as any);

    expect(result).toBeUndefined();
    expect(transactionsRepositoryMock.setApiPayData).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.setApiPayStatusInfo).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundError si la transacción no existe', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce(null);

    await expect(service.getTransactionAndRefresh('tx-404')).rejects.toMatchObject({
      message: 'Transaction not found',
    });

    expect(transactionsRepositoryMock.get).toHaveBeenCalledWith('tx-404');
    expect(apipayMock.getTransaction).not.toHaveBeenCalled();
  });

  it('si ya está finalizada (APPROVED/DECLINED/ERROR) debe retornar tx sin llamar a apipay', async () => {
    const tx = { txId: 'tx-1', status: 'APPROVED' };
    transactionsRepositoryMock.get.mockResolvedValueOnce(tx);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(result).toBe(tx);
    expect(apipayMock.getTransaction).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.updateStatus).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.setApiPayStatusInfo).not.toHaveBeenCalled();
  });

  it('si no hay apiPayTxId (PENDING creado pero no pagado), retorna tx sin llamar a apipay', async () => {
    const tx = { txId: 'tx-1', status: 'PENDING', apipay: undefined };
    transactionsRepositoryMock.get.mockResolvedValueOnce(tx);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(result).toBe(tx);
    expect(apipayMock.getTransaction).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.updateStatus).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.setApiPayStatusInfo).not.toHaveBeenCalled();
  });

  it('si apipay responde PENDING, retorna el tx local sin persistir cambios', async () => {
    const tx = { txId: 'tx-1', status: 'PENDING', apipay: { apiPayTxId: 'pay-1' } };
    transactionsRepositoryMock.get.mockResolvedValueOnce(tx);

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'PENDING',
      status_message: 'Still pending',
    });

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(apipayMock.getTransaction).toHaveBeenCalledWith('pay-1');
    expect(result).toBe(tx);

    expect(transactionsRepositoryMock.setApiPayStatusInfo).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.updateStatus).not.toHaveBeenCalled();
    expect(transactionsRepositoryMock.finalizeStockDiscountOnce).not.toHaveBeenCalled();
    expect(productsRepositoryMock.decrementStock).not.toHaveBeenCalled();
  });

  it('APPROVED: debe persistir status, guardar status info, finalizar descuento una vez y decrementar stock si canFinalize=true', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      productId: 'p-001',
      quantity: 2,
      apipay: { apiPayTxId: 'pay-1' },
    });

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'APPROVED',
      status_message: 'Approved',
    });

    transactionsRepositoryMock.finalizeStockDiscountOnce.mockResolvedValueOnce(true);
    productsRepositoryMock.decrementStock.mockResolvedValueOnce(undefined);

    const persisted = { txId: 'tx-1', status: 'APPROVED', productId: 'p-001', quantity: 2 };
    transactionsRepositoryMock.get.mockResolvedValueOnce(persisted);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(apipayMock.getTransaction).toHaveBeenCalledWith('pay-1');

    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenCalledWith(
      'tx-1',
      'Approved',
      undefined
    );
    expect(transactionsRepositoryMock.updateStatus).toHaveBeenCalledWith('tx-1', 'APPROVED');

    expect(transactionsRepositoryMock.finalizeStockDiscountOnce).toHaveBeenCalledWith('tx-1');
    expect(productsRepositoryMock.decrementStock).toHaveBeenCalledWith('p-001', 2);

    expect(result).toEqual(persisted);
  });

  it('APPROVED: si canFinalize=false NO debe decrementar stock', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      productId: 'p-001',
      quantity: 2,
      apipay: { apiPayTxId: 'pay-1' },
    });

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'APPROVED',
      status_message: 'Approved',
    });

    transactionsRepositoryMock.finalizeStockDiscountOnce.mockResolvedValueOnce(false);

    const persisted = { txId: 'tx-1', status: 'APPROVED' };
    transactionsRepositoryMock.get.mockResolvedValueOnce(persisted);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(transactionsRepositoryMock.updateStatus).toHaveBeenCalledWith('tx-1', 'APPROVED');
    expect(transactionsRepositoryMock.finalizeStockDiscountOnce).toHaveBeenCalledWith('tx-1');

    expect(productsRepositoryMock.decrementStock).not.toHaveBeenCalled();
    expect(result).toEqual(persisted);
  });

  it('APPROVED: si decrementStock falla, debe marcar ERROR y setear status info con "Stock update failed"', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      productId: 'p-001',
      quantity: 2,
      apipay: { apiPayTxId: 'pay-1' },
    });

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'APPROVED',
      status_message: 'Approved',
    });

    transactionsRepositoryMock.finalizeStockDiscountOnce.mockResolvedValueOnce(true);
    productsRepositoryMock.decrementStock.mockRejectedValueOnce(new Error('boom'));

    const persisted = { txId: 'tx-1', status: 'ERROR' };
    transactionsRepositoryMock.get.mockResolvedValueOnce(persisted);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenNthCalledWith(
      1,
      'tx-1',
      'Approved',
      undefined
    );
    expect(transactionsRepositoryMock.updateStatus).toHaveBeenNthCalledWith(1, 'tx-1', 'APPROVED');

    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenNthCalledWith(
      2,
      'tx-1',
      'Approved',
      'Stock update failed'
    );
    expect(transactionsRepositoryMock.updateStatus).toHaveBeenNthCalledWith(2, 'tx-1', 'ERROR');

    expect(result).toEqual(persisted);
  });

  it('DECLINED: debe mapear, persistir status info y status final; NO toca stock', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      productId: 'p-001',
      quantity: 2,
      apipay: { apiPayTxId: 'pay-1' },
    });

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'DECLINED',
      status_message: 'Card declined',
    });

    const persisted = { txId: 'tx-1', status: 'DECLINED' };
    transactionsRepositoryMock.get.mockResolvedValueOnce(persisted);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenCalledWith(
      'tx-1',
      'Card declined',
      undefined
    );
    expect(transactionsRepositoryMock.updateStatus).toHaveBeenCalledWith('tx-1', 'DECLINED');

    expect(transactionsRepositoryMock.finalizeStockDiscountOnce).not.toHaveBeenCalled();
    expect(productsRepositoryMock.decrementStock).not.toHaveBeenCalled();

    expect(result).toEqual(persisted);
  });

  it('ERROR (o status desconocido): debe mapear a ERROR y guardar status_message como error', async () => {
    transactionsRepositoryMock.get.mockResolvedValueOnce({
      txId: 'tx-1',
      status: 'PENDING',
      apipay: { apiPayTxId: 'pay-1' },
    });

    apipayMock.getTransaction.mockResolvedValueOnce({
      status: 'SOME_WEIRD_STATUS',
      status_message: 'Provider failed',
    });

    const persisted = { txId: 'tx-1', status: 'ERROR' };
    transactionsRepositoryMock.get.mockResolvedValueOnce(persisted);

    const result = await service.getTransactionAndRefresh('tx-1');

    expect(transactionsRepositoryMock.setApiPayStatusInfo).toHaveBeenCalledWith(
      'tx-1',
      'Provider failed',
      'Provider failed'
    );
    expect(transactionsRepositoryMock.updateStatus).toHaveBeenCalledWith('tx-1', 'ERROR');

    expect(result).toEqual(persisted);
  });

});
