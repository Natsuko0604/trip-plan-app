// マイページ用のアカウント情報を更新
import { APIGatewayProxyHandler } from "aws-lambda";
import { CORS, response } from "../lib/cors";
import { errorName } from "../lib/error";
import { selfPutSchema } from "@tripla/validation";
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

  const parsedRequest = selfPutSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return response(400, {
      message: parsedRequest.error.issues[0]?.path.length
        ? parsedRequest.error.issues[0].message
        : "リクエストボディが正しくありません",
    });
  }
  try {
    const { nickName, email } = parsedRequest.data;
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;

    if (typeof cognitoSub !== "string" || !cognitoSub) {
      return response(401, {
        message: "ユーザーが見つかりませんでした",
      });
    }

    const db = await getDb();

    const [updatedUser] = await db
      .update(users)
      .set({ nickName, email })
      .where(and(eq(users.cognitoSub, cognitoSub), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        nickName: users.nickName,
        email: users.email,
      });

    if (!updatedUser) {
      return response(404, {
        message: "ユーザーが見つかりません",
      });
    }
    return response(200, {
      updatedUser: updatedUser,
      message: "アカウント情報の更新に成功しました",
    });
  } catch (error) {
    console.error("アカウント情報の更新に失敗しました", {
      requestId,
      errorName: errorName(error),
    });
    return response(500, {
      message: "アカウント情報の更新に失敗しました",
    });
  }
};
