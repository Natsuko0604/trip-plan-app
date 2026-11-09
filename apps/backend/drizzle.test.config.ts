import { defineConfig } from "drizzle-kit";

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error("TEST_DATABASE_URL を設定してください");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dbCredentials: { url },
});
