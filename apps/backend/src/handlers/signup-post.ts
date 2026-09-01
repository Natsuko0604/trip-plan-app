import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  InvalidParameterException,
  InvalidPasswordException,
  TooManyRequestsException,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";

// Node.jsからAmazon Cognitoへ命令を送るためのクライアント
const cognitoClient = new CognitoIdentityProviderClient({});

// Lambdaの環境変数からCognito User PoolのIDを取得
const userPoolId = process.env.COGNITO_USER_POOL_ID;

// 環境ごとにCORSで許可するフロントエンドURLを切り替える
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

// API Gatewayへ返すレスポンス形式を共通化
function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS,
    body: JSON.stringify(body),
  };
}

// Error型ならエラー名を取得し、それ以外ならUnknownErrorを返す
function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

// パスワード設定やDB登録に失敗した場合、作成済みCognitoユーザーを削除
async function deleteCognitoUser(email: string): Promise<void> {
  if (!userPoolId) {
    return;
  }

  try {
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    );
  } catch (error) {
    console.error("Cognitoユーザーのロールバックに失敗しました", {
      errorName: errorName(error),
    });
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // API Gatewayが各リクエストに付ける一意のIDを取得
  const requestId = event.requestContext.requestId;

  // OPTIONSリクエストにCORS事前確認の成功レスポンスを返す
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS,
      body: "",
    };
  }

  // LambdaからuserPoolId取得に失敗した場合
  if (!userPoolId) {
    console.error("COGNITO_USER_POOL_IDが設定されていません", {
      requestId,
    });

    return response(500, {
      message: "サーバー設定に問題があります",
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

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return response(400, {
      message: "リクエストボディが正しくありません",
    });
  }

  const body = requestBody as Record<string, unknown>;

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return response(400, {
      message: "emailとpasswordは必須です",
    });
  }

  // 完全なメール検証ではなく、明らかな入力ミスを弾くための簡易チェック
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response(400, {
      message: "メールアドレスの形式が正しくありません",
    });
  }

  let cognitoUserCreated = false;

  try {
    // ユーザー作成
    const createdUser = await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: "SUPPRESS", // Cognitoから招待メールを送信しない
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
        ],
      }),
    );

    cognitoUserCreated = true;

    const cognitoSub = createdUser.User?.Attributes?.find(
      (attribute) => attribute.Name === "sub",
    )?.Value;

    if (!cognitoSub) {
      throw new Error("Cognitoユーザーのsubを取得できませんでした");
    }

    // 入力されたパスワードを恒久パスワードに設定
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true, // 一時パスワードではなく通常のパスワードとして設定される
      }),
    );

    // Cognitoユーザーに対応するユーザーをDBへ登録
    const db = await getDb();

    // 新規作成時はニックネーム空文字で設定
    const nickName = "";

    const [createdDatabaseUser] = await db
      .insert(users)
      .values({
        nickName,
        cognitoSub,
        email,
      })
      .returning({
        id: users.id,
      });

    if (!createdDatabaseUser) {
      throw new Error("DBユーザーを作成できませんでした");
    }

    return response(201, {
      message: "ユーザーを作成しました",
      user: {
        id: createdDatabaseUser.id,
        email,
      },
    });
  } catch (error) {
    if (cognitoUserCreated) {
      await deleteCognitoUser(email);
    }

    if (error instanceof UsernameExistsException) {
      return response(409, {
        message: "このメールアドレスは既に登録されています",
      });
    }

    if (
      error instanceof InvalidPasswordException ||
      error instanceof InvalidParameterException
    ) {
      return response(400, {
        message: "入力内容がCognitoの登録条件を満たしていません",
      });
    }

    if (error instanceof TooManyRequestsException) {
      return response(429, {
        message: "リクエストが多すぎます。時間をおいて再度お試しください",
      });
    }

    // passwordやリクエストボディ全体はログに出さない
    console.error("Signup failed", {
      requestId,
      errorName: errorName(error),
    });

    return response(500, {
      message: "ユーザー登録に失敗しました",
    });
  }
};
