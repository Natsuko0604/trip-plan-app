// ログインの単体テスト

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LoginForm } from "./login-form";
import userEvent from "@testing-library/user-event";
import { signIn } from "aws-amplify/auth";

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
}));

const signInMock = vi.mocked(signIn);

const setup = () => {
  const user = userEvent.setup();

  render(<LoginForm />);

  const emailInput = screen.getByLabelText("メールアドレス");
  const passwordInput = screen.getByLabelText("パスワード");
  const passwordVisibilityButton = screen.getByRole("button", {
    name: "パスワードを表示する",
  });
  const submitButton = screen.getByRole("button", {
    name: "ログインする",
  });
  return {
    user,
    emailInput,
    passwordInput,
    passwordVisibilityButton,
    submitButton,
  };
};

// 成功モック
const signInSuccessResult = {
  isSignedIn: true,
  nextStep: {
    signInStep: "DONE" as const,
  },
};

// 失敗モック
const signInErrorResult = {
  isSignedIn: false,
  nextStep: {
    signInStep: "DONE" as const,
  },
};

// ユーザーが見つからない
const userNotFoundError = Object.assign(new Error("User does not exist"), {
  name: "UserNotFoundException",
});

describe("入力バリデーション", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  test("メールアドレスが未入力の場合はsignInを呼ばない", async () => {
    const { user, passwordInput, submitButton } = setup();
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("パスワードが未入力の場合はsignInを呼ばない", async () => {
    const { user, emailInput, submitButton } = setup();
    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("メールアドレス形式が不正な場合はsignInを呼ばない", async () => {
    const { user, emailInput, submitButton } = setup();
    await user.type(emailInput, "testExample.com");
    await user.click(submitButton);
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("メールアドレス前後の空白を除去する", async () => {
    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, " test@example.com ");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);
    expect(signInMock).toHaveBeenCalledWith({
      username: "test@example.com",
      password: "Password123!",
    });
  });

  test("メールアドレスを小文字に正規化してsignInへ1回渡す", async () => {
    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "Test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);
    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(signInMock).toHaveBeenCalledWith({
      username: "test@example.com",
      password: "Password123!",
    });
  });

  test("パスワードは空白除去や小文字変換を行わない", async () => {
    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, " Password123! ");
    await user.click(submitButton);
    expect(signInMock).toHaveBeenCalledWith({
      username: "test@example.com",
      password: " Password123! ",
    });
  });
});

describe("ログイン成功", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  test("isSignedIn: trueをログイン成功として扱う", async () => {
    signInMock.mockResolvedValue(signInSuccessResult);
    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(replaceMock).toHaveBeenCalledWith("/plans");
  });

  test("ログイン成功時にエラーメッセージを表示しない", async () => {
    signInMock.mockResolvedValue(signInSuccessResult);
    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      screen.queryByText("メールアドレスまたはパスワードが正しくありません"),
    ).not.toBeInTheDocument();
  });
});

describe("ログイン失敗", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  test("パスワードが間違っている場合に共通エラーメッセージを表示する", async () => {
    signInMock.mockRejectedValue(new Error("Incorrect username or password"));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "WrongPassword123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("ユーザーが存在しない場合に共通エラーメッセージを表示する", async () => {
    signInMock.mockRejectedValue(userNotFoundError);

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "unknown@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("ユーザー不存在とパスワード間違いで同じメッセージを表示する", async () => {
    signInMock.mockRejectedValue(userNotFoundError);
    signInMock.mockRejectedValue(new Error("Incorrect username or password"));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "WrongPassword123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("Cognitoとの通信に失敗した場合にエラーメッセージを表示する", async () => {
    signInMock.mockRejectedValue(new Error("Network request failed"));
    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("再送信時に以前のエラーメッセージを消す", async () => {
    signInMock.mockRejectedValue(new Error("Network request failed"));
    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();
    signInMock.mockResolvedValue(signInSuccessResult);
    await user.click(submitButton);
    expect(
      screen.queryByText("メールアドレスまたはパスワードが正しくありません"),
    ).not.toBeInTheDocument();
  });
});

describe("未完了の認証", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  test("isSignedIn: falseをログイン成功として扱わず、追加認証が必要なメッセージを表示し、画面遷移しない", async () => {
    signInMock.mockResolvedValue(signInErrorResult);
    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(replaceMock).not.toHaveBeenCalledWith("/plans");
    expect(screen.findByText("ログインを完了するには追加の認証が必要です"));
  });
});

describe("送信状態", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  test("認証処理中に「ログイン中...」を表示する", async () => {
    signInMock.mockImplementation(() => new Promise(() => {}));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByRole("button", {
        name: "ログイン中...",
      }),
    ).toBeInTheDocument();
  });
  test("認証処理中はログインボタンを無効にする", async () => {
    signInMock.mockImplementation(() => new Promise(() => {}));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByRole("button", {
        name: "ログイン中...",
      }),
    ).toBeDisabled();
  });
  test("認証処理中の連続クリックでsignInを二重に呼ばない", async () => {
    signInMock.mockImplementation(() => new Promise(() => {}));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");

    await user.click(submitButton);

    expect(
      await screen.findByRole("button", {
        name: "ログイン中...",
      }),
    ).toBeDisabled();

    await user.click(submitButton);

    expect(signInMock).toHaveBeenCalledTimes(1);
  });
  test("ログイン失敗後にログインボタンを再度有効にする", async () => {
    signInMock.mockRejectedValueOnce(
      new Error("Incorrect username or password"),
    );

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "WrongPassword123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", {
        name: "ログインする",
      }),
    ).toBeEnabled();
  });
  test("未完了の認証後にログインボタンを再度有効にする", async () => {
    signInMock.mockResolvedValueOnce(signInErrorResult);

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByText("ログインを完了するには追加の認証が必要です"),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", {
        name: "ログインする",
      }),
    ).toBeEnabled();
  });
});

describe("セキュリティ", () => {
  test("Cognitoから返された詳細なエラーを画面へそのまま表示しない", async () => {
    const detailedError = "User test@example.com does not exist";

    signInMock.mockRejectedValueOnce(new Error(detailedError));

    const { user, emailInput, passwordInput, submitButton } = setup();

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "メールアドレスまたはパスワードが正しくありません",
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText(detailedError)).not.toBeInTheDocument();
  });
});
