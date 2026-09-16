// お気に入りの旅行計画一覧取得
import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { errorName } from "../lib/error";
import { getDb } from "../db";
import {
  favorites,
  plans,
  prefecturePlans,
  prefectures,
  users,
} from "../db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

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

    // cognitoからcognitoSub取得
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
      });
    }

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

    // Plansテーブルから旅行計画一覧を取得
    const planList = await db
      .select({
        id: plans.id,
        userId: plans.userId,
        title: plans.title,
        startedAt: plans.startedAt,
        endedAt: plans.endedAt,
        comment: plans.comment,
        imageUrl: plans.imageUrl,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .innerJoin(favorites, eq(favorites.planId, plans.id))
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(plans.isPublic, true),
          isNull(plans.deletedAt),
        ),
      )
      .orderBy(desc(favorites.createdAt));

    const prefecturePlansList = await db
      .select({
        id: prefectures.id,
        planId: prefecturePlans.planId,
        name: prefectures.name,
        isCompleted: prefecturePlans.isCompleted,
      })
      .from(prefecturePlans)
      .innerJoin(prefectures, eq(prefecturePlans.prefectureId, prefectures.id))
      .innerJoin(plans, eq(prefecturePlans.planId, plans.id))
      .innerJoin(favorites, eq(favorites.planId, plans.id))
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(plans.isPublic, true),
          isNull(plans.deletedAt),
        ),
      );

    return response(200, {
      planList,
      prefectures: prefecturePlansList,
      message: "お気に入りの旅行計画一覧を取得しました",
    });
  } catch (error) {
    console.error("お気に入りの旅行計画一覧取得に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "お気に入りの旅行計画一覧取得に失敗しました",
    });
  }
};
