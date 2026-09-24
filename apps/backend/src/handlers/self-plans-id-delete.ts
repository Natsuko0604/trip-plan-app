// 自分の旅行計画を削除
import { planIdPathSchema } from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { plans, users } from "../db/schema";
import { CORS, response } from "../lib/cors";
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

  const parsedPath = planIdPathSchema.safeParse(event.pathParameters);
  if (!parsedPath.success) {
    return response(400, {
      message: event.pathParameters?.planId
        ? "旅行計画IDの形式が正しくありません"
        : "旅行計画IDがありません",
    });
  }

  try {
    const { planId } = parsedPath.data;
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "認証情報を取得できませんでした",
      });
    }

    const db = await getDb();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.cognitoSub, cognitoSub), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return response(404, {
        message: "ユーザーが見つかりません",
      });
    }

    const [deletedPlan] = await db
      .update(plans)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(plans.id, planId),
          eq(plans.userId, user.id),
          isNull(plans.deletedAt),
        ),
      )
      .returning({
        id: plans.id,
        deletedAt: plans.deletedAt,
      });

    if (!deletedPlan) {
      return response(404, {
        message: "旅行計画が見つかりません",
      });
    }

    return response(200, {
      message: "旅行計画の削除に成功しました",
      plan: deletedPlan,
    });
  } catch (error) {
    console.error("旅行計画の削除に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "旅行計画の削除に失敗しました",
    });
  }
};
