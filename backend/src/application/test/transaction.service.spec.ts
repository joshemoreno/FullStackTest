import { Test } from '@nestjs/testing';
import { TransactionsService } from '../transactions.service';
import { TransactionsRepository } from '../../infrastructure/repository/transactions.repository';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const repoMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: TransactionsRepository, useValue: repoMock },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('get() debe retornar la transacción si existe', async () => {
    const tx = { txId: 'tx-1', status: 'PENDING' };

    repoMock.get.mockResolvedValueOnce(tx);

    const result = await service.get('tx-1');

    expect(repoMock.get).toHaveBeenCalledTimes(1);
    expect(repoMock.get).toHaveBeenCalledWith('tx-1');
    expect(result).toBe(tx);
  });

  it('get() debe lanzar error si no existe la transacción', async () => {
    repoMock.get.mockResolvedValueOnce(null);

    await expect(service.get('tx-404')).rejects.toMatchObject({
      message: 'Transaction not found',
    });

    expect(repoMock.get).toHaveBeenCalledTimes(1);
    expect(repoMock.get).toHaveBeenCalledWith('tx-404');
  });

  it('get() debe propagar errores del repo', async () => {
    repoMock.get.mockRejectedValueOnce(new Error('DB error'));

    await expect(service.get('tx-1')).rejects.toThrow('DB error');
    expect(repoMock.get).toHaveBeenCalledTimes(1);
  });
});
