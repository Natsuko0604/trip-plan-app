// 旅行記録の取得
import { APIGatewayProxyHandler } from "aws-lambda";
import { errorName } from "../lib/error";
import { CORS, response } from "../lib/cors";
import { getDb } from "../db";
import { prefecturePlans, prefectures, users } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";

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

    const memoryList = await db
      .selectDistinct({
        id: prefectures.id,
        name: prefectures.name,
      })
      .from(prefectures)
      .innerJoin(
        prefecturePlans,
        eq(prefecturePlans.prefectureId, prefectures.id),
      )
      .where(
        and(
          eq(prefecturePlans.userId, user.id),
          eq(prefecturePlans.isCompleted, true),
        ),
      );

    return response(200, {
      memoryList: memoryList,
      message: "旅行記録の取得に成功しました",
    });
  } catch (error) {
    console.error("旅行記録の取得に失敗しました", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "旅行記録の取得に失敗しました",
    });
  }
};
