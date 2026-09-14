import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS } from "../lib/cors";
import { getDb } from "../db";

// // 商品詳細取得
// export const handler: APIGatewayProxyHandler = async (event) => {
//   const requestId = event.requestContext.requestId;

//   // OPTIONSリクエストにCORS事前確認の成功レスポンスを返す
//   if (event.httpMethod === "OPTIONS") {
//     return {
//       statusCode: 204,
//       headers: CORS,
//       body: "",
//     };
//   }

//   try {
//     const db = getDb();

//     // Users, Plans, PrefecturesPlans, Hotels, Restaurants, TouringSpots, PackingItems, TimeLinesテーブル

//   } catch {}
// };
