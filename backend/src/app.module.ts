import { Module } from '@nestjs/common';
import { ProductsController } from './interfaces/http/products.controller';
import { DynamoModule } from './infrastructure/dynamo/dynamo.module';

@Module({
  imports: [DynamoModule],
  controllers: [ProductsController],
})
export class AppModule {}
