//自分のお気に入り追加

import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { getDb } from "../db";
import { favorites, plans, users } from "../db/schema";
import { eq } from "drizzle-orm";
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
    // DB接続を取得
    const db = await getDb();

    // cognitoからcognitoSub取得
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
      });
    }

    // Cognitoのsubに対応するDBユーザーを取得
    const [user] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.cognitoSub, cognitoSub))
      .limit(1);

    if (!user) {
      return response(404, {
        message: "ユーザーが見つかりません",
      });
    }

    // URLのIDから、お気に入り対象の旅行計画を検索
    const favoriteId = event.pathParameters?.planId;
    if (!favoriteId) {
      return response(400, {
        message: "お気に入りIDがありません",
      });
    }

    // favoriteIdのUUID形式検証
    const UUID_PATTERN =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_PATTERN.test(favoriteId)) {
      return response(400, {
        message: "お気に入りIDの形式が正しくありません",
      });
    }

    // お気に入り対象の旅行計画をplansテーブルから取得
    const [plan] = await db
      .select({
        id: plans.id,
      })
      .from(plans)
      .where(eq(plans.id, favoriteId))
      .limit(1);

    if (!plan) {
      return response(404, {
        message: "旅行計画が見つかりません",
      });
    }

    // favoritesへuserID,plansIDをinsert
    const [addFavorite] = await db
      .insert(favorites)
      .values({
        userId: user.id,
        planId: plan.id,
      })
      .onConflictDoNothing()
      .returning();
    if (!addFavorite) {
      return response(409, {
        message: "既にお気に入り登録済みのためDB保存できませんでした",
      });
    }
    return response(201, {
      message: "お気に入り登録が成功しました",
    });
  } catch (error) {
    console.error("お気に入り登録に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "お気に入り登録ができませんでした",
    });
  }
};
