import { Injectable } from '@nestjs/common';
import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../dynamo/dynamo.client';
import { env } from '../../config/env';
import { Transaction, TxStatus } from '../../domain/types/Transaction.type';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly dynamo: DynamoService) {}

  async create(tx: Transaction): Promise<void> {
    await this.dynamo.doc.send(
      new PutCommand({
        TableName: env.TRANSACTIONS_TABLE,
        Item: tx,
      })
    );
  }

  async get(txId: string): Promise<Transaction | null> {
    const res = await this.dynamo.doc.send(
      new GetCommand({
        TableName: env.TRANSACTIONS_TABLE,
        Key: { txId },
      })
    );
    return (res.Item as Transaction) ?? null;
  }

  async updateStatus(txId: string, status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR') {
    const now = new Date().toISOString();

    await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: env.TRANSACTIONS_TABLE,
        Key: { txId },
        UpdateExpression: 'SET #status = :s, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':s': status, ':now': now },
      })
    );
  }

  async setApiPayData(
    txId: string,
    apiPayTxId: string,
    referenceTx: string
  ): Promise<void> {    
    const now = new Date().toISOString();
    await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: env.TRANSACTIONS_TABLE,
        Key: { txId },
        UpdateExpression: `
          SET apipay = :apiPayObj,
              updatedAt = :now
        `,
        ExpressionAttributeValues: {
          ':apiPayObj': { apiPayTxId, referenceTx },
          ':now': now,
        },
      })
    );
  }


  async finalizeStockDiscountOnce(txId: string): Promise<boolean> {
    try {
      await this.dynamo.doc.send(
        new UpdateCommand({
          TableName: env.TRANSACTIONS_TABLE,
          Key: { txId },
          UpdateExpression: 'SET stockDiscounted = :t',
          ConditionExpression:
            'attribute_not_exists(stockDiscounted) OR stockDiscounted = :f',
          ExpressionAttributeValues: { ':t': true, ':f': false },
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async setApiPayStatusInfo(
    txId: string,
    statusMessage?: string,
    lastError?: string
  ) {
    const now = new Date().toISOString();
    await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: env.TRANSACTIONS_TABLE,
        Key: { txId },
        UpdateExpression:
          'SET apipay.statusMessage = :m, apipay.lastError = :e, updatedAt = :now',
        ExpressionAttributeValues: {
          ':m': statusMessage ?? null,
          ':e': lastError ?? null,
          ':now': now,
        },
      })
    );
  }

async updateFinalStatus(params: {
  txId: string;
  status: 'APPROVED' | 'DECLINED' | 'ERROR';
  apipayStatusMessage?: string;
  apipayLastError?: string;
}) {
  const now = new Date().toISOString();

  await this.dynamo.doc.send(new UpdateCommand({
    TableName: env.TRANSACTIONS_TABLE,
    Key: { txId: params.txId },
    UpdateExpression:
      'SET #status = :s, updatedAt = :now, apipay.statusMessage = :m, apipay.lastError = :e',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':s': params.status,
      ':now': now,
      ':m': params.apipayStatusMessage ?? null,
      ':e': params.apipayLastError ?? null,
    },
  }));
}

}
