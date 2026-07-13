import { MongoClient, ServerApiVersion, Db } from "mongodb";

let client: MongoClient;
let db: Db;

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI as string;

    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

export const getDB = (): Db => {
  if (!db) throw new Error("DB not initialized — call connectDB() first");
  return db;
};
