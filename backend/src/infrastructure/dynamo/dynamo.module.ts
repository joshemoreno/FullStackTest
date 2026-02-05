import { Module } from '@nestjs/common';
import { DynamoService } from './dynamo.client';

@Module({
  providers: [DynamoService],
  exports: [DynamoService],
})
export class DynamoModule {}
