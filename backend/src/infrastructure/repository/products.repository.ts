import { Injectable } from '@nestjs/common';
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../dynamo/dynamo.client';
import { Product } from '../../domain/types/Product.type';
import { env } from '../../config/env';

@Injectable()
export class ProductsRepository {
  constructor(private readonly dynamo: DynamoService) {}

  async list(): Promise<Product[]> {   
    const res = await this.dynamo.doc.send(
      new ScanCommand({ TableName: env.PRODUCTS_TABLE })
    );
    return (res.Items ?? []) as Product[];
  }

  async get(productId: string): Promise<Product | null> {
    const res = await this.dynamo.doc.send(
      new GetCommand({
        TableName: env.PRODUCTS_TABLE,
        Key: { productId },
      })
    );
    return (res.Item as Product) ?? null;
  }

  async decrementStock(productId: string, quantity: number): Promise<void> {
    await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: env.PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: 'SET stock = stock - :q',
        ConditionExpression: 'stock >= :q',
        ExpressionAttributeValues: { ':q': quantity },
      })
    );
  }
}
