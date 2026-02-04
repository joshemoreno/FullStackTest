import { Injectable } from '@nestjs/common';
import { GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from './dynamo.client';
import { Product } from '../../domain/types/Product.type';

@Injectable()
export class ProductsRepository {
  private table = process.env.PRODUCTS_TABLE!;

  async list(): Promise<Product[]> {
    const res = await dynamoDocClient.send(new ScanCommand({ TableName: this.table }));
    return (res.Items ?? []) as Product[];
  }

  async get(productId: string): Promise<Product | null> {
    const res = await dynamoDocClient.send(new GetCommand({
      TableName: this.table,
      Key: { productId },
    }));
    return (res.Item as Product) ?? null;
  }

  async decrementStock(productId: string, qty: number): Promise<number> {
    const res = await dynamoDocClient.send(new UpdateCommand({
      TableName: this.table,
      Key: { productId },
      UpdateExpression: 'SET stock = stock - :qty',
      ConditionExpression: 'stock >= :qty',
      ExpressionAttributeValues: { ':qty': qty },
      ReturnValues: 'UPDATED_NEW',
    }));
    return (res.Attributes?.stock as number) ?? -1;
  }
}
