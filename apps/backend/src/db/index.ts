import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.js";

const secretsManagerClient = new SecretsManagerClient({});

// 同じLambda実行環境ではDB接続を再利用する
let dbPromise: Promise<NodePgDatabase<typeof schema>> | undefined;

async function createDb(): Promise<NodePgDatabase<typeof schema>> {
  const secretArn = process.env.DB_SECRET_ARN;
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT ?? "5432");

  if (!secretArn || !host || !database) {
    throw new Error("DB接続用の環境変数が設定されていません");
  }

  if (!Number.isInteger(port)) {
    throw new Error("DB_PORTが正しくありません");
  }

  const secretResult = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    }),
  );

  if (!secretResult.SecretString) {
    throw new Error("DB認証情報を取得できませんでした");
  }

  const credentials = JSON.parse(secretResult.SecretString) as {
    username?: string;
    password?: string;
  };

  if (!credentials.username || !credentials.password) {
    throw new Error("DB認証情報が不足しています");
  }

  const pool = new Pool({
    host,
    port,
    database,
    user: credentials.username,
    password: credentials.password,
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return drizzle(pool, {
    schema,
  });
}

export async function getDb(): Promise<NodePgDatabase<typeof schema>> {
  if (!dbPromise) {
    dbPromise = createDb().catch((error) => {
      // 接続失敗を永続的にキャッシュせず、次回リクエストで再試行する
      dbPromise = undefined;
      throw error;
    });
  }

  return dbPromise;
}
