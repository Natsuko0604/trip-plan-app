// 旅行計画一覧取得

import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { getDb } from "../db";
import { plans } from "../db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { errorName } from "../lib/error";

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // OPTIONSリクエストにCORS事前確認の成功レスポンスを返す
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS,
      body: "",
    };
  }

  try {
    const db = await getDb();

    // Plansテーブルから旅行計画一覧を取得
    const publicPlans = await db
      .select({
        id: plans.id,
        title: plans.title,
        imageUrl: plans.imageUrl,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .where(and(eq(plans.isPublic, true), isNull(plans.deletedAt)))
      .orderBy(desc(plans.updatedAt));

    return response(200, {
      plans: publicPlans,
      message: "旅行計画一覧の取得に成功しました",
    });
  } catch (error) {
    console.error("旅行計画一覧取得に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "旅行計画一覧取得に失敗しました",
    });
  }
};
