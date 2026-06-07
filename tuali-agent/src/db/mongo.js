const { MongoClient } = require('mongodb');

let db;

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || 'tuali_growth');
  console.log('✅ MongoDB conectado →', process.env.DB_NAME);
  return db;
}

function getDB() {
  if (!db) throw new Error('DB no inicializada. Llama connectDB() primero.');
  return db;
}

module.exports = { connectDB, getDB };
