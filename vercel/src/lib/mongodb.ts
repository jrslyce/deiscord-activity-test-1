import { MongoClient, MongoClientOptions } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // IMPORTANT: do NOT throw at module-eval time.
    // Next.js may evaluate route modules during build.
    throw new Error(
      "Missing MONGODB_URI. Set it in Vercel Project Settings → Environment Variables.",
    );
  }
  // Log the URI (with password masked) for debugging
  const maskedUri = uri.replace(/:[^:@]+@/, ":****@");
  console.log("[MongoDB] Connecting with URI:", maskedUri);
  return uri;
}

async function getClient(): Promise<MongoClient> {
  const uri = getMongoUri();
  
  // Verify URI format before creating client
  if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
    throw new Error(`Invalid MongoDB URI format: ${uri.substring(0, 50)}...`);
  }
  
  // Check if password is properly encoded (should not contain unencoded @)
  const uriMatch = uri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
  if (uriMatch && uriMatch[1].includes('@') && !uriMatch[1].includes('%40')) {
    throw new Error('MongoDB password contains unencoded @ character. Please URL-encode the password.');
  }

  // MongoDB connection options for better reliability
  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  };

  if (process.env.NODE_ENV === "development") {
    // Always create a fresh connection in development to pick up env changes
    if (global._mongoClientPromise) {
      try {
        const oldClient = await global._mongoClientPromise;
        await oldClient.close();
      } catch (e) {
        // Ignore errors when closing old client
      }
    }
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((error) => {
      console.error("[MongoDB] Connection failed:", error.message);
      console.error("[MongoDB] Full error:", error);
      throw new Error(
        `MongoDB connection failed: ${error.message}. Please check:\n` +
        `1. Your internet connection\n` +
        `2. MongoDB Atlas IP whitelist (should allow 0.0.0.0/0 for development)\n` +
        `3. MongoDB cluster is running\n` +
        `4. Connection string is correct`
      );
    });
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((error) => {
      console.error("[MongoDB] Connection failed:", error.message);
      throw new Error(
        `MongoDB connection failed: ${error.message}. Please check your MongoDB Atlas configuration.`
      );
    });
  }

  return clientPromise;
}

export async function getDb() {
  const c = await getClient();
  return c.db(process.env.DB_NAME || undefined);
}
