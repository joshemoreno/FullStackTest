import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.IS_OFFLINE === 'true';

export const dynamoDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'us-east-1',
    endpoint: isLocal ? 'http://localhost:8000' : undefined,
    credentials: isLocal
      ? { accessKeyId: 'local', secretAccessKey: 'local' }
      : undefined,
  }),
  { marshallOptions: { removeUndefinedValues: true } }
);
