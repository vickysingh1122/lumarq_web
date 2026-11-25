import { MongoClient } from 'mongodb';

let connection;

export async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('Database configuration missing');
  if (!connection) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    connection = client.connect().catch(async (error) => {
      connection = undefined;
      await client.close();
      throw error;
    });
  }
  return (await connection).db(process.env.MONGODB_DB || 'lumarq');
}

export async function closeDatabase() {
  if (connection) await (await connection).close();
  connection = undefined;
}
