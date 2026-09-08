// 旅行計画作成
import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { plans, users } from "../db/schema";
import { getDb } from "../db";
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

  // リクエスト本文がない場合
  if (!event.body) {
    return response(400, {
      message: "リクエストボディが必要です",
    });
  }
  // リクエストの形式が正しくない場合
  let requestBody: unknown;

  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return response(400, {
      message: "JSONの形式が正しくありません",
    });
  }

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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : false;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

  if (!title) {
    return response(400, {
      message: "タイトルは必須です",
    });
  }
  if (body.isPublic !== undefined && typeof body.isPublic !== "boolean") {
    return response(400, {
      message: "isPublicはbooleanで指定してください",
    });
  }
  if (
    body.imageUrl !== undefined &&
    body.imageUrl !== null &&
    typeof body.imageUrl !== "string"
  ) {
    return response(400, {
      message: "imageUrlの形式が正しくありません",
    });
  }

  try {
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;
    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "認証情報を取得できませんでした",
      });
    }

    // DB接続を取得
    const db = await getDb();

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

    const [selfPlans] = await db
      .insert(plans)
      .values({
        userId: user.id,
        title,
        isPublic,
        imageUrl,
      })
      .returning({
        id: plans.id,
        title: plans.title,
        isPublic: plans.isPublic,
        imageUrl: plans.imageUrl,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      });

    if (!selfPlans) {
      throw new Error("新しい旅行計画を作成できませんでした");
    }

    return response(201, {
      message: "新しい旅行計画を作成しました",
      plans: selfPlans,
    });
  } catch (error) {
    console.error("新しい旅行計画を作成できませんでした", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "旅行計画を作成できませんでした",
    });
  }
};
