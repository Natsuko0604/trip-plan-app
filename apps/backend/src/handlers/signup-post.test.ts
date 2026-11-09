import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  InvalidPasswordException,
  TooManyRequestsException,
  UsernameExistsException,
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

      if (command instanceof AdminDeleteUserCommand) {
        return {};
      }

      throw new Error("想定外のCognitoコマンドです");
    });

  return cognito;
};

// subをレスポンスとして返さない関数
const mockCognitoWithoutSub = async () => {
  const { cognitoClient } = await import("../lib/cognito.js");

  return vi.spyOn(cognitoClient, "send").mockImplementation(async (command) => {
    if (command instanceof AdminCreateUserCommand) {
      return {
        User: {
          // email属性はあるが、sub属性がない
          Attributes: [
            {
              Name: "email",
              Value: "test@example.com",
            },
          ],
        },
      };
    }

    if (command instanceof AdminDeleteUserCommand) {
      // sub取得失敗後のロールバック
      return {};
    }

    throw new Error("想定外のCognitoコマンドです");
  });
};

// テスト用Access-Control-Allow-Origin
const ALLOWEDORIGIN = "http://localhost:3000";

describe("新規会員登録 Lambda", () => {
  beforeEach(async () => {
    const { getDb } = await import("../db/index.js");
    const { users } = await import("../db/schema.js");
    const db = await getDb();

    await db.delete(users).where(eq(users.email, "test@example.com"));
  });

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

describe("Cognito・DBの異常系", () => {
  test("同じメールアドレスが登録済みの場合に`409`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send").mockRejectedValueOnce(
      new UsernameExistsException({
        message: "User already exists",
        $metadata: {},
      }),
    );
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(409);
  });

  test("Cognitoのパスワード条件違反で`400`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send").mockRejectedValueOnce(
      new UsernameExistsException({
        message: "User already exists",
        $metadata: {},
      }),
    );
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(400);
  });

  test("Cognitoの入力条件違反で`400`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send").mockRejectedValueOnce(
      new InvalidPasswordException({
        message: "Password does not conform to policy",
        $metadata: {},
      }),
    );
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(400);
  });

  test("Cognitoのリクエスト制限時に`429`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();
    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send").mockRejectedValueOnce(
      new TooManyRequestsException({
        message: "There are too many requests",
        $metadata: {},
      }),
    );
    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);
    expect(response?.statusCode).toBe(429);
  });

  test("Cognitoユーザーから`sub`を取得できない場合に`500`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    await mockCognitoWithoutSub();

    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    expect(response?.statusCode).toBe(500);
  });

  test("DB登録に失敗した場合に`500`を返す", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    await mockCognitoSuccess();

    // DB処理だけ失敗させる
    const dbModule = await import("../db/index.js");

    vi.spyOn(dbModule, "getDb").mockRejectedValueOnce(
      new Error("DB registration failed"),
    );

    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    expect(response?.statusCode).toBe(500);
  });

  test("パスワード設定に失敗した場合、作成済みCognitoユーザーを削除する", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    const { cognitoClient } = await import("../lib/cognito.js");

    const cognitoSpy = vi
      .spyOn(cognitoClient, "send")
      // 1回目：ユーザー作成成功
      .mockResolvedValueOnce({
        User: {
          Attributes: [{ Name: "sub", Value: "test-cognito-sub" }],
        },
      } as never)
      // 2回目：パスワード設定失敗
      .mockRejectedValueOnce(new Error("Password setting failed"))
      // 3回目：ユーザー削除成功
      .mockResolvedValueOnce({} as never);

    await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    // 3回目の呼び出しに削除処理が渡されたか
    expect(cognitoSpy).toHaveBeenNthCalledWith(
      3,
      expect.any(AdminDeleteUserCommand),
    );
  });

  test("DB登録に失敗した場合、作成済みCognitoユーザーを削除する", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    const cognitoSpy = await mockCognitoSuccess();

    // DB処理だけ失敗させる
    const dbModule = await import("../db/index.js");

    vi.spyOn(dbModule, "getDb").mockRejectedValueOnce(
      new Error("DB registration failed"),
    );

    await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    expect(cognitoSpy).toHaveBeenCalledWith(expect.any(AdminDeleteUserCommand));
  });

  test("Cognitoユーザーの削除失敗時も元のエラー応答を維持する", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send")
      .mockResolvedValueOnce({
        User: {
          Attributes: [{ Name: "sub", Value: "test-sub" }],
        },
      } as never)
      // パスワード設定失敗
      .mockRejectedValueOnce(
        new InvalidPasswordException({
          message: "Invalid password",
          $metadata: {},
        }),
      )
      // ユーザー削除も失敗
      .mockRejectedValueOnce(new Error("Delete failed"));

    const response = await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    expect(response?.statusCode).toBe(400);
  });

  test("エラーログにパスワードやリクエストボディ全体を出力しない", async () => {
    vi.stubEnv("COGNITO_USER_POOL_ID", "12345");
    vi.resetModules();

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { cognitoClient } = await import("../lib/cognito.js");

    vi.spyOn(cognitoClient, "send").mockRejectedValueOnce(
      new Error("Unexpected error"),
    );

    await callHandler({
      ...postRequest,
      body: JSON.stringify({
        email: "test@example.com",
        password: "testPassword123!",
        privacyAccepted: true,
      }),
    } as APIGatewayProxyEvent);

    expect(consoleSpy).toHaveBeenCalledWith("Signup failed", {
      requestId: "test-requestId",
      errorName: "Error",
    });
  });
});
