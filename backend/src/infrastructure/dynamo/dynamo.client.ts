import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../../config/env';

@Injectable()
export class DynamoService {
  readonly doc: DynamoDBDocumentClient;

  constructor() {
    const client = new DynamoDBClient({
      region: env.REGION,
      endpoint: env.IS_OFFLINE ? env.DYNAMO_ENDPOINT : undefined,
      credentials: env.IS_OFFLINE ? { accessKeyId: 'local', secretAccessKey: 'local' } : undefined,
    });
    this.doc = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
}
