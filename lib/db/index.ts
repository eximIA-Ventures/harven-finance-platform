import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: ReturnType<typeof drizzle> | undefined;
};

function getClient() {
  if (globalForDb.pgClient) return globalForDb.pgClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 5,
    idle_timeout: 30,
    connect_timeout: 15,
    max_lifetime: 60 * 5,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pgClient = client;
  }

  return client;
}

function getDb() {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const instance = drizzle(getClient(), { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.drizzleDb = instance;
  }

  return instance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});

export { schema };
