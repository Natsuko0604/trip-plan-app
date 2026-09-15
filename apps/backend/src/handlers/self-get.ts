// マイページのユーザー情報の取得
import { APIGatewayProxyHandler } from "aws-lambda";
import { errorName } from "../lib/error";
import { CORS, response } from "../lib/cors";
import { getDb } from "../db";
import { users } from "../db/schema";
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

    const [userInfo] = await db
      .select({
        id: users.id,
        nickName: users.nickName,
        email: users.email,
      })
      .from(users)
      .where(and(eq(users.cognitoSub, cognitoSub), isNull(users.deletedAt)))
      .limit(1);

    if (!userInfo) {
      return response(404, {
        message: "ユーザーが見つかりません",
      });
    }

    return response(200, {
      userInfo: userInfo,
      message: "マイページのユーザー情報の取得に成功しました",
    });
  } catch (error) {
    console.error("マイページのユーザー情報の取得に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "マイページのユーザー情報の取得に失敗しました",
    });
  }
};
