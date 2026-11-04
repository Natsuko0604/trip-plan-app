// 新規会員登録の単体テスト
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./signup-form";
import { signupPost } from "../api/signup";
import { signIn } from "aws-amplify/auth";

// 新規登録APIのモック
vi.mock("../api/signup", () => ({
  signupPost: vi.fn(),
}));

const signupPostMock = vi.mocked(signupPost);

// Cognitoログインのモック
vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
}));

const signInMock = vi.mocked(signIn);

// 画面遷移関数のモック
const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const setup = () => {
  const user = userEvent.setup();

  render(<SignupForm />);

  const emailInput = screen.getByLabelText("メールアドレス");
  const passwordInput = screen.getByLabelText("パスワード");
  const submitButton = screen.getByRole("button", {
    name: "登録する",
  });

  return {
    user,
    emailInput,
    passwordInput,
    submitButton,
  };
};

describe("入力バリデーションが正しい", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("正しい形式のメールアドレスとパスワードを受け付ける", async () => {
    const { user, emailInput, passwordInput } = setup();
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "PasswordTest123!");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("PasswordTest123!");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("メールアドレスを小文字へ変換して登録APIへ渡し、登録処理を呼ぶ", async () => {
    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "Test@Example.com");
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(signupPostMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "PasswordTest123!",
    });
  });

  test("メールアドレスが未入力の場合に拒否する", async () => {
    const { user, passwordInput, submitButton } = setup();
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(
      await screen.findByText("メールアドレスは入力必須です"),
    ).toBeInTheDocument();
    expect(signupPostMock).not.toHaveBeenCalled();
  });

  test("パスワードが未入力の場合に拒否する", async () => {
    const { user, emailInput, submitButton } = setup();
    await user.type(emailInput, "Test@Example.com");
    await user.click(submitButton);

    expect(
      await screen.findByText("パスワードは入力必須です"),
    ).toBeInTheDocument();
    expect(signupPost).not.toHaveBeenCalled();
  });

  test("メールアドレス形式が不正な場合に拒否する", async () => {
    const { user, passwordInput, emailInput, submitButton } = setup();
    await user.type(emailInput, "TestExample.com");
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(
      await screen.findByText("メールアドレスの形式が正しくありません"),
    ).toBeInTheDocument();
    expect(signupPost).not.toHaveBeenCalled();
  });

  test("254文字を超えるメールアドレスを拒否する", async () => {
    const { user, passwordInput, emailInput, submitButton } = setup();
    await user.type(emailInput, `${"a".repeat(243)}@TestExample.com`);
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(
      await screen.findByText("メールアドレスは254文字以内で入力してください"),
    ).toBeInTheDocument();
    expect(signupPost).not.toHaveBeenCalled();
  });

  test("Cognitoの条件を満たさないパスワードをエラーとして扱う", async () => {
    const { user, passwordInput, emailInput, submitButton } = setup();
    await user.type(emailInput, "TestExample.com");
    await user.type(passwordInput, "Password");
    await user.click(submitButton);

    expect(
      await screen.findByText(
        "パスワードは8文字以上で、大文字・小文字・数字を含めてください",
      ),
    ).toBeInTheDocument();
    expect(signupPost).not.toHaveBeenCalled();
  });
});

describe("登録フォームが正しい", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("メールアドレス入力欄、パスワード入力欄、登録ボタンが表示される", () => {
    render(<SignupForm />);
    expect(screen.getAllByLabelText("メールアドレス"));
    expect(screen.getAllByLabelText("パスワード"));
    expect(screen.getByRole("button", { name: "登録する" }));
  });

  test("登録処理中はボタンが無効になる", async () => {
    signupPostMock.mockReturnValue(new Promise(() => {}));

    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "Test@Example.com");
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test("登録ボタンを連続クリックしても二重送信されない", async () => {
    signupPostMock.mockReturnValue(new Promise(() => {}));

    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "Test@Example.com");
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    await user.click(submitButton);
    expect(signupPostMock).toHaveBeenCalledTimes(1);
  });

  test("登録成功後に自動ログインして旅行計画一覧へ移動する", async () => {
    // 新規会員登録APIが成功した状態を再現
    signupPostMock.mockResolvedValue({});
    // Cognitoへの自動ログインが完了した状態を再現
    signInMock.mockResolvedValue({
      isSignedIn: true,
      nextStep: {
        signInStep: "DONE",
      },
    });

    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput, "Test@Example.com");
    await user.type(passwordInput, "PasswordTest123!");
    await user.click(submitButton);
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        username: "test@example.com",
        password: "PasswordTest123!",
      });

      expect(replaceMock).toHaveBeenCalledWith("/plans");
    });
  });
});
