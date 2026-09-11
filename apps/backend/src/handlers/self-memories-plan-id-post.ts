// 地図作成

import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { getDb } from "../db";
import { plans, prefecturePlans, prefectures, users } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";
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

  // リクエスト本文がない場合
  if (!event.body) {
    return response(400, {
      message: "リクエストボディが必要です",
    });
  }

  // リクエストが正しくない場合
  let requestBody: unknown;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return response(400, {
      message: "JSONの形式が正しくありません",
    });
  }

  // クライアントから送られてきたリクエストbody
  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return response(400, {
      message: "リクエストボディが正しくありません",
    });
  }

  // クライアントから送られてきたリクエストbody
  const body = requestBody as Record<string, unknown>;

  // リクエストの型を確認するため
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return response(400, {
      message: "都道府県の設定は必須です",
    });
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

    // URLのidから、そのユーザー所有のplansを検索
    const planId = event.pathParameters?.planId;
    if (!planId) {
      return response(400, {
        message: "旅行計画IDがありません",
      });
    }

    // planIdのUUID形式検証
    const UUID_PATTERN =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_PATTERN.test(planId)) {
      return response(400, {
        message: "旅行計画IDの形式が正しくありません",
      });
    }

    const [plan] = await db
      .select({
        id: plans.id,
      })
      .from(plans)
      .where(
        and(
          eq(plans.id, planId),
          eq(plans.userId, user.id),
          isNull(plans.deletedAt),
        ),
      )
      .limit(1);

    if (!plan) {
      return response(404, {
        message: "このアカウントの旅行計画はありません",
      });
    }

    // prefecturesをリクエストのnameで検索
    const [prefecture] = await db
      .select({
        id: prefectures.id,
      })
      .from(prefectures)
      .where(eq(prefectures.name, name))
      .limit(1);
    if (!prefecture) {
      return response(404, {
        message: "該当の都道府県が見つかりません",
      });
    }

    // prefecturePlansへ両方のIDをinsert
    const [prefecturePlan] = await db
      .insert(prefecturePlans)
      .values({
        prefectureId: prefecture.id,
        planId: plan.id,
        isCompleted: true,
      })
      .onConflictDoNothing({
        target: [prefecturePlans.planId, prefecturePlans.prefectureId],
      })
      .returning();
    if (!prefecturePlan) {
      return response(409, {
        message: "既に登録済みのためDB保存できませんでした",
      });
    }

    return response(201, {
      message: "ピースが追加されました",
      memory: prefecturePlan,
    });
  } catch (error) {
    console.error("新しいピースを追加できませんでした", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "新しいピースを作成できませんでした",
    });
  }
};
