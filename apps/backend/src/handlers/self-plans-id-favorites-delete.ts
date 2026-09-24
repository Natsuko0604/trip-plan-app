// 自分のお気に入り旅行計画を削除
import { planIdPathSchema } from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { favorites, users } from "../db/schema";
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

    const [deletedFavorite] = await db
      .delete(favorites)
      .where(and(eq(favorites.planId, planId), eq(favorites.userId, user.id)))
      .returning({
        id: favorites.id,
        planId: favorites.planId,
      });

    if (!deletedFavorite) {
      return response(404, {
        message: "お気に入りの旅行計画が見つかりません",
      });
    }

    return response(200, {
      message: "お気に入りの旅行計画の削除に成功しました",
      favorite: deletedFavorite,
    });
  } catch (error) {
    console.error("お気に入りの旅行計画の削除に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "お気に入りの旅行計画の削除に失敗しました",
    });
  }
};
