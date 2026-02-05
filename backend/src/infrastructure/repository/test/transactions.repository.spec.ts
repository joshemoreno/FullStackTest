import { Test } from '@nestjs/testing';
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TransactionsRepository } from '../transactions.repository';
import { DynamoService } from '../../dynamo/dynamo.client';

jest.mock('../../../config/env', () => ({
  env: {
    TRANSACTIONS_TABLE: 'transactions-table-test',
  },
}));

describe('TransactionsRepository', () => {
  let repo: TransactionsRepository;

  const sendMock = jest.fn();
  const dynamoServiceMock = {
    doc: { send: sendMock },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-05T12:00:00.000Z'));

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsRepository,
        { provide: DynamoService, useValue: dynamoServiceMock },
      ],
    }).compile();

    repo = moduleRef.get(TransactionsRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('create(): debe enviar PutCommand con Item=tx', async () => {
    sendMock.mockResolvedValueOnce({});

    const tx: any = { txId: 'tx-1', status: 'PENDING', total_in_cents: 1000 };

    await repo.create(tx);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(PutCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Item: tx,
    });
  });

  it('get(): debe enviar GetCommand con Key y retornar Item', async () => {
    sendMock.mockResolvedValueOnce({ Item: { txId: 'tx-1', status: 'PENDING' } });

    const result = await repo.get('tx-1');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(GetCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Key: { txId: 'tx-1' },
    });

    expect(result).toEqual({ txId: 'tx-1', status: 'PENDING' });
  });

  it('get(): si no hay Item debe retornar null', async () => {
    sendMock.mockResolvedValueOnce({});

    const result = await repo.get('tx-404');
    expect(result).toBeNull();
  });

  it('updateStatus(): debe enviar UpdateCommand con status y updatedAt', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.updateStatus('tx-1', 'APPROVED');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(UpdateCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Key: { txId: 'tx-1' },
      UpdateExpression: 'SET #status = :s, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':s': 'APPROVED',
        ':now': '2026-02-05T12:00:00.000Z',
      },
    });
  });

  it('setApiPayData(): debe setear apipay obj y updatedAt', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.setApiPayData('tx-1', 'pay-1', 'TX-tx-1');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(UpdateCommand);

    // Nota: tu UpdateExpression tiene backticks y espacios/saltos de línea.
    // Para que el test no sea frágil, validamos por partes.
    expect((cmd as any).input.TableName).toBe('transactions-table-test');
    expect((cmd as any).input.Key).toEqual({ txId: 'tx-1' });

    expect((cmd as any).input.UpdateExpression).toContain('SET apipay = :apiPayObj');
    expect((cmd as any).input.UpdateExpression).toContain('updatedAt = :now');

    expect((cmd as any).input.ExpressionAttributeValues).toEqual({
      ':apiPayObj': { apiPayTxId: 'pay-1', referenceTx: 'TX-tx-1' },
      ':now': '2026-02-05T12:00:00.000Z',
    });
  });

  it('finalizeStockDiscountOnce(): retorna true si el UpdateCommand pasa', async () => {
    sendMock.mockResolvedValueOnce({});

    const result = await repo.finalizeStockDiscountOnce('tx-1');

    expect(result).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);

    const cmd = sendMock.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(UpdateCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Key: { txId: 'tx-1' },
      UpdateExpression: 'SET stockDiscounted = :t',
      ConditionExpression:
        'attribute_not_exists(stockDiscounted) OR stockDiscounted = :f',
      ExpressionAttributeValues: { ':t': true, ':f': false },
    });
  });

  it('finalizeStockDiscountOnce(): retorna false si el UpdateCommand falla', async () => {
    sendMock.mockRejectedValueOnce(new Error('ConditionalCheckFailedException'));

    const result = await repo.finalizeStockDiscountOnce('tx-1');

    expect(result).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('setApiPayStatusInfo(): debe setear statusMessage/lastError y updatedAt (con nulls si undefined)', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.setApiPayStatusInfo('tx-1');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(UpdateCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Key: { txId: 'tx-1' },
      UpdateExpression:
        'SET apipay.statusMessage = :m, apipay.lastError = :e, updatedAt = :now',
      ExpressionAttributeValues: {
        ':m': null,
        ':e': null,
        ':now': '2026-02-05T12:00:00.000Z',
      },
    });
  });

  it('setApiPayStatusInfo(): debe setear valores si se pasan', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.setApiPayStatusInfo('tx-1', 'Approved', 'Oops');

    const cmd = sendMock.mock.calls[0][0];
    expect((cmd as any).input.ExpressionAttributeValues).toEqual({
      ':m': 'Approved',
      ':e': 'Oops',
      ':now': '2026-02-05T12:00:00.000Z',
    });
  });

  it('updateFinalStatus(): debe setear status final + apipay status info + updatedAt', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.updateFinalStatus({
      txId: 'tx-1',
      status: 'DECLINED',
      apipayStatusMessage: 'Declined',
      apipayLastError: 'Insufficient funds',
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(UpdateCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'transactions-table-test',
      Key: { txId: 'tx-1' },
      UpdateExpression:
        'SET #status = :s, updatedAt = :now, apipay.statusMessage = :m, apipay.lastError = :e',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':s': 'DECLINED',
        ':now': '2026-02-05T12:00:00.000Z',
        ':m': 'Declined',
        ':e': 'Insufficient funds',
      },
    });
  });

  it('updateFinalStatus(): debe usar nulls si no vienen apipayStatusMessage/apipayLastError', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.updateFinalStatus({
      txId: 'tx-1',
      status: 'ERROR',
    });

    const cmd = sendMock.mock.calls[0][0];
    expect((cmd as any).input.ExpressionAttributeValues).toEqual({
      ':s': 'ERROR',
      ':now': '2026-02-05T12:00:00.000Z',
      ':m': null,
      ':e': null,
    });
  });
});
