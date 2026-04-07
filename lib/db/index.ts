import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DbType = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: DbType | undefined;
};

function createDb(): DbType {
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

  return drizzle(client, { schema });
}

function getDb(): DbType {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const instance = createDb();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.drizzleDb = instance;
  }

  return instance;
}

export const db: DbType = new Proxy({} as DbType, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});

export { schema };
