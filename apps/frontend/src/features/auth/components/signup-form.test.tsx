// 新規会員登録の単体テスト
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./signup-form";
import { signupPost } from "../api/signup";

vi.mock("../api/signup", () => ({
  signupPost: vi.fn(),
}));

const signupPostMock = vi.mocked(signupPost);

describe("入力バリデーションが正しい", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

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

  test("正しい形式のメールアドレスとパスワードを受け付ける", async () => {
    const { user, emailInput, passwordInput } = setup();
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "PasswordTest123!");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("PasswordTest123!");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("メールアドレスを小文字へ変換して登録APIへ渡す", async () => {
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
});
