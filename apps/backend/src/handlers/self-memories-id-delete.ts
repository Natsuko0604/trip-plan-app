// 旅行記録の削除
import { uuidSchema } from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { prefecturePlans, users } from "../db/schema";
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

  const parsedMemoryId = uuidSchema.safeParse(event.pathParameters?.memoryId);
  if (!parsedMemoryId.success) {
    return response(400, {
      message: event.pathParameters?.memoryId
        ? "旅行記録IDの形式が正しくありません"
        : "旅行記録IDがありません",
    });
  }

  try {
    const memoryId = parsedMemoryId.data;
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

    const [deletedMemory] = await db
      .delete(prefecturePlans)
      .where(
        and(
          eq(prefecturePlans.id, memoryId),
          eq(prefecturePlans.userId, user.id),
          eq(prefecturePlans.isCompleted, true),
        ),
      )
      .returning({
        id: prefecturePlans.id,
        prefectureId: prefecturePlans.prefectureId,
        planId: prefecturePlans.planId,
      });

    if (!deletedMemory) {
      return response(404, {
        message: "旅行記録が見つかりません",
      });
    }

    return response(200, {
      message: "旅行記録の削除に成功しました",
      memory: deletedMemory,
    });
  } catch (error) {
    console.error("旅行記録の削除に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "旅行記録の削除に失敗しました",
    });
  }
};
