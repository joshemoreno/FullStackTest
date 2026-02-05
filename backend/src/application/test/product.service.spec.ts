import { Test } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { ProductsRepository } from '../../infrastructure/repository/products.repository';

describe('ProductsService', () => {
  let service: ProductsService;

  const productsRepoMock = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: productsRepoMock },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('list() debe delegar en productsRepo.list() y retornar su resultado', async () => {
    const expected = [
      { productId: 'p-1', price_in_cents: 10000, stock: 5, active: true },
      { productId: 'p-2', price_in_cents: 20000, stock: 0, active: false },
    ];

    productsRepoMock.list.mockResolvedValueOnce(expected);

    const result = await service.list();

    expect(productsRepoMock.list).toHaveBeenCalledTimes(1);
    expect(productsRepoMock.list).toHaveBeenCalledWith();
    expect(result).toBe(expected);
  });

  it('list() debe propagar errores del repo', async () => {
    productsRepoMock.list.mockRejectedValueOnce(new Error('DB down'));

    await expect(service.list()).rejects.toThrow('DB down');
    expect(productsRepoMock.list).toHaveBeenCalledTimes(1);
  });
});
