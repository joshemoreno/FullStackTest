import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

async function run() {
  const list = await client.send(new ListTablesCommand({}));
  console.log('Tables now:', list.TableNames);

  await client.send(new CreateTableCommand({
    TableName: 'products-local',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'productId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'productId', KeyType: 'HASH' }],
  }));

  await client.send(new CreateTableCommand({
    TableName: 'transactions-local',
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'txId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'txId', KeyType: 'HASH' }],
  }));

  const list2 = await client.send(new ListTablesCommand({}));
  console.log('Tables after:', list2.TableNames);
}

run().catch(console.error);
