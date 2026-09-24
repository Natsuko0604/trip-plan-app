// 持ち物の更新
import { packingItemSchema, planIdPathSchema } from "@tripla/validation";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { packingItems, plans, users } from "../db/schema";
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

  const parsedRequest = packingItemSchema.array().safeParse(requestBody);

  if (!parsedRequest.success) {
    return response(400, {
      message: parsedRequest.error.issues[0]?.path.length
        ? parsedRequest.error.issues[0].message
        : "リクエストボディが正しくありません",
    });
  }

  try {
    const { planId } = parsedPath.data;
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
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

    const [plan] = await db
      .select({ id: plans.id })
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
        message: "旅行計画が見つかりません",
      });
    }

    const updatedPackingItems = await db.transaction(async (tx) => {
      await tx.delete(packingItems).where(eq(packingItems.planId, planId));

      if (!parsedRequest.data.length) {
        return [];
      }

      return tx
        .insert(packingItems)
        .values(
          parsedRequest.data.map((packingItem) => ({
            planId,
            name: packingItem.name,
            isReady: packingItem.isReady,
          })),
        )
        .returning({
          id: packingItems.id,
          name: packingItems.name,
          isReady: packingItems.isReady,
          createdAt: packingItems.createdAt,
          updatedAt: packingItems.updatedAt,
        });
    });

    return response(200, {
      updatedPackingItems,
      message: "持ち物の更新に成功しました",
    });
  } catch (error) {
    console.error("持ち物の更新に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "持ち物の更新に失敗しました",
    });
  }
};
