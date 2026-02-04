import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.IS_OFFLINE === 'true';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'us-east-1',
    endpoint: isLocal ? 'http://localhost:8000' : undefined,
    credentials: isLocal ? { accessKeyId: 'local', secretAccessKey: 'local' } : undefined,
  })
);

async function run() {
  const table = process.env.PRODUCTS_TABLE;
  if (!table) throw new Error('Missing PRODUCTS_TABLE env var');

  const now = new Date().toISOString();
  const items = [
    {
      productId: 'p-001',
      name: 'Producto demo',
      description: 'Producto de prueba para checkout',
      price: 25000,
      imageUrl: '',
      stock: 10,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: 'p-002',
      name: 'Producto demo 2',
      description: 'Producto de prueba para checkout',
      price: 20000,
      imageUrl: '',
      stock: 5,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: 'p-003',
      name: 'Producto demo 3',
      description: 'Producto de prueba para checkout',
      price: 50000,
      imageUrl: '',
      stock: 15,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const item of items) {
    await client.send(new PutCommand({ TableName: table, Item: item }));
    console.log('Seeded:', item.productId);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
