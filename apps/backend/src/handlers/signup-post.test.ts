import { describe, expect, test, vi, afterEach } from "vitest";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { eq } from "drizzle-orm";

// OPTIONSリクエスト
const optionsRequest = {
  httpMethod: "OPTIONS",
  requestContext: { requestId: "test-requestId" },
};

// handlerにOPTIONSリクエストを渡す
const callHandler = async (optionsRequest: APIGatewayProxyEvent) => {
  const { handler } = await import("./signup-post.js");
  const result = handler(optionsRequest, {} as Context, () => {});
  return result;
};

// POSTリクエスト
const postRequest = {
  httpMethod: "POST",
  requestContext: { requestId: "test-requestId" },
};

const mockCognitoSuccess = async () => {
  const { cognitoClient } = await import("../lib/cognito.js");

  const cognito = vi
    .spyOn(cognitoClient, "send")
    .mockImplementation(async (command) => {
      if (command instanceof AdminCreateUserCommand) {
        return {
          User: {
            Attributes: [{ Name: "sub", Value: "test-cognito-sub" }],
          },
        };
      }

      if (command instanceof AdminSetUserPasswordCommand) {
        return {};
      }

      throw new Error("想定外のCognitoコマンドです");
    });

  return cognito;
};

// テスト用Access-Control-Allow-Origin
const ALLOWEDORIGIN = "http://localhost:3000";

describe("新規会員登録 Lambda", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("OPTIONSリクエストに`204`とCORSヘッダーを返す", async () => {
    const response = await callHandler(optionsRequest as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(204);
    expect(response?.headers).toMatchObject({
      "Access-Control-Allow-Origin": ALLOWEDORIGIN,
    });
  });

  test("User Pool IDが未設定の場合に`500`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", undefined);
    vi.resetModules();
    const response = await callHandler(postRequest as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(500);
  });

  test("リクエストボディがない場合に`400`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const response = await callHandler({
      ...postRequest,
      body: null,
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(400);
  });

  test("JSONが壊れている場合に`400`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const response = await callHandler({
      ...postRequest,
      body: "{",
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(400);
  });

  test("入力バリデーション失敗時にCognitoやDBを呼ばない", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "invalid-email",
        password: "Password123!",
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(400);
  });

  test("正常時にCognitoユーザーを作成し、DBに保存する", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    await mockCognitoSuccess();
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(201);

    const { getDb } = await import("../db/index.js");
    const { users } = await import("../db/schema.js");
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"));

    expect(user?.cognitoSub).toBe("test-cognito-sub");
  });
});

// Cognito・DBの異常系

// 同じメールアドレスが登録済みの場合に`409`を返す
// Cognitoのパスワード条件違反で`400`を返す
// Cognitoの入力条件違反で`400`を返すc
// Cognitoのリクエスト制限時に`429`を返す
// Cognitoユーザーから`sub`を取得できない場合に`500`を返す
// DB登録に失敗した場合に`500`を返す
// パスワード設定に失敗した場合、作成済みCognitoユーザーを削除する
// DB登録に失敗した場合、作成済みCognitoユーザーを削除する
// Cognitoユーザーの削除にも失敗した場合、元のエラー応答を維持する
// エラーログにパスワードやリクエストボディ全体を出力しない
