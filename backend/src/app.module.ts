import { Module } from '@nestjs/common';
import { ProductsController } from './interfaces/http/products.controller';
import { DynamoModule } from './infrastructure/dynamo/dynamo.module';
import { ProductsService } from './application/products.service';
import { ProductsRepository } from './infrastructure/repository/products.repository';
import { ApiPayModule } from './infrastructure/apipay/apipay.module';
import { CheckoutController } from './interfaces/http/checkout.controller';
import { TransactionsController } from './interfaces/http/transactions.controller';
import { CheckoutService } from './application/checkout.service';
import { TransactionsRepository } from './infrastructure/repository/transactions.repository';

@Module({
  imports: [DynamoModule, ApiPayModule],
  controllers: [ProductsController, CheckoutController, TransactionsController],
  providers:[
    ProductsService,
    ProductsRepository,
    CheckoutService,
    TransactionsRepository,
  ]
})
export class AppModule {}
