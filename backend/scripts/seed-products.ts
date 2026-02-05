import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.IS_OFFLINE === 'true';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.REGION,
    endpoint: isLocal ? process.env.DYNAMO_ENDPOINT: undefined,
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
      name: 'Monitor LG',
      description: 'Producto de prueba para checkout',
      price_in_cents: 1500000,
      imageUrl: 'https://tecnoplaza.com.co/cdn/shop/files/8-galeria-periferica-1_1500x1500-bfc550c8-32a1-4a07-a909-ff05f47a43e9.jpg?v=1768316870&width=533',
      stock: 10,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: 'p-002',
      name: 'Teclado',
      description: 'Producto de prueba para checkout',
      price_in_cents: 1000000,
      imageUrl: 'https://m.media-amazon.com/images/I/51F4d5LTbdL._AC_UF894,1000_QL80_.jpg',
      stock: 5,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: 'p-003',
      name: 'Silla oficina',
      description: 'Producto de prueba para checkout',
      price_in_cents: 2000000,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_YRXCLBEbaO1StVUOPpuhBCU6xxcD93sCGQ&s',
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
