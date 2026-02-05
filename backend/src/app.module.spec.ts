import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ProductsController } from './interfaces/http/products.controller';
import { CheckoutController } from './interfaces/http/checkout.controller';
import { TransactionsController } from './interfaces/http/transactions.controller';
import { ProductsService } from './application/products.service';
import { CheckoutService } from './application/checkout.service';
import { ProductsRepository } from './infrastructure/repository/products.repository';
import { TransactionsRepository } from './infrastructure/repository/transactions.repository';

describe('AppModule', () => {
  it('debe compilar el módulo', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });

  it('debe registrar controllers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(ProductsController)).toBeDefined();
    expect(moduleRef.get(CheckoutController)).toBeDefined();
    expect(moduleRef.get(TransactionsController)).toBeDefined();
  });

  it('debe registrar services y repositories', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(ProductsService)).toBeDefined();
    expect(moduleRef.get(CheckoutService)).toBeDefined();
    expect(moduleRef.get(ProductsRepository)).toBeDefined();
    expect(moduleRef.get(TransactionsRepository)).toBeDefined();
  });
});
