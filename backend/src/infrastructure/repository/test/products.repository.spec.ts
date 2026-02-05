import { Test } from '@nestjs/testing';
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ProductsRepository } from '../products.repository';
import { DynamoService } from '../../dynamo/dynamo.client';

jest.mock('../../../config/env', () => ({
  env: {
    PRODUCTS_TABLE: 'products-table-test',
  },
}));

describe('ProductsRepository', () => {
  let repo: ProductsRepository;

  const sendMock = jest.fn();

  const dynamoServiceMock = {
    doc: {
      send: sendMock,
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: DynamoService, useValue: dynamoServiceMock },
      ],
    }).compile();

    repo = moduleRef.get(ProductsRepository);
  });

  it('list(): debe hacer ScanCommand y retornar Items (o [])', async () => {
    sendMock.mockResolvedValueOnce({
      Items: [
        { productId: 'p-1', price_in_cents: 10000, stock: 5, active: true },
      ],
    });

    const result = await repo.list();

    expect(sendMock).toHaveBeenCalledTimes(1);

    const cmd = sendMock.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(ScanCommand);
    expect((cmd as any).input).toEqual({ TableName: 'products-table-test' });

    expect(result).toEqual([
      { productId: 'p-1', price_in_cents: 10000, stock: 5, active: true },
    ]);
  });

  it('list(): si no hay Items debe retornar []', async () => {
    sendMock.mockResolvedValueOnce({});

    const result = await repo.list();

    expect(result).toEqual([]);
  });

  it('get(): debe hacer GetCommand con Key y retornar Item', async () => {
    sendMock.mockResolvedValueOnce({
      Item: { productId: 'p-1', price_in_cents: 10000, stock: 5, active: true },
    });

    const result = await repo.get('p-1');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(GetCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'products-table-test',
      Key: { productId: 'p-1' },
    });

    expect(result).toEqual({
      productId: 'p-1',
      price_in_cents: 10000,
      stock: 5,
      active: true,
    });
  });

  it('get(): si no hay Item debe retornar null', async () => {
    sendMock.mockResolvedValueOnce({});

    const result = await repo.get('p-404');

    expect(result).toBeNull();
  });

  it('decrementStock(): debe hacer UpdateCommand con UpdateExpression y ConditionExpression correctos', async () => {
    sendMock.mockResolvedValueOnce({});

    await repo.decrementStock('p-1', 2);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];

    expect(cmd).toBeInstanceOf(UpdateCommand);
    expect((cmd as any).input).toEqual({
      TableName: 'products-table-test',
      Key: { productId: 'p-1' },
      UpdateExpression: 'SET stock = stock - :q',
      ConditionExpression: 'stock >= :q',
      ExpressionAttributeValues: { ':q': 2 },
    });
  });

  it('decrementStock(): debe propagar errores de Dynamo (ej: conditional check)', async () => {
    sendMock.mockRejectedValueOnce(new Error('ConditionalCheckFailedException'));

    await expect(repo.decrementStock('p-1', 999)).rejects.toThrow(
      'ConditionalCheckFailedException'
    );
  });
});
