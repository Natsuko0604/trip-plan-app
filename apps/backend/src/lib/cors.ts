import { APIGatewayProxyResult } from "aws-lambda";

// 環境ごとにCORSで許可するフロントエンドURLを切り替える
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

export const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

// API Gatewayへ返すレスポンス形式を共通化
export function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS,
    body: JSON.stringify(body),
  };
}
