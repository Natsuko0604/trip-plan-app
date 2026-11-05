"use client";

import "@/lib/amplify";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { useState } from "react";
import { signupPostSchema } from "@tripla/validation";
import { PasswordField, TextField } from "./auth-fields";
import { signupPost } from "../api/signup";
import { ErrorMessage } from "./error-message";
import { z } from "zod";

type SignupFormErrors = {
  email?: string;
  password?: string;
  privacyAccepted?: string;
};

export function SignupForm() {
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  // 会員登録用のAPIを呼び出す
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    try {
      event.preventDefault(); // フォーム送信によるページの再読み込みを防ぐ
      const formData = new FormData(event.currentTarget); // 送信されたフォームの入力値を取得
      const email = formData.get("email");
      const password = formData.get("password");
      const privacyAccepted = formData.get("privacyAccepted") === "on";
      if (typeof email !== "string" || typeof password !== "string") return;
      const result = signupPostSchema.safeParse({
        email,
        password,
        privacyAccepted,
      });

      if (!result.success) {
        const fieldErrors = z.flattenError(result.error).fieldErrors;

        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
          privacyAccepted: fieldErrors.privacyAccepted?.[0],
        });

        return;
      }

      setErrors({});
      setIsLoading(true);
      await signupPost(result.data);
      const signInResult = await signIn({
        username: result.data.email,
        password: result.data.password,
      });

      if (signInResult.isSignedIn) {
        router.replace("/plans");
        return;
      }

      throw new Error("自動ログインを完了できませんでした");
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "ユーザー登録に失敗しました",
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
        required
        errorMessage={errors.email}
        onChange={() => {
          setErrors((current) => ({
            ...current,
            email: undefined,
          }));
        }}
      />
      <PasswordField
        autoComplete="new-password"
        required
        errorMessage={errors.password}
        onChange={() => {
          setErrors((current) => ({
            ...current,
            password: undefined,
          }));
        }}
      />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-500 sm:text-base">
        <input
          type="checkbox"
          name="privacyAccepted"
          className="mt-1 size-4 shrink-0 accent-[#83bbb5]"
          required
        />
        <span>
          プライバシーポリシーに同意しますか{" "}
          <button
            type="button"
            className="font-medium text-[#83bbb5] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bbfba]"
          >
            プライバシーポリシー
          </button>
        </span>
      </label>
      {errors.privacyAccepted && (
        <ErrorMessage message={errors.privacyAccepted} />
      )}
      {submitError && <ErrorMessage message={submitError} />}
      <button
        type="submit"
        className="mt-2 h-14 w-full rounded-xl border border-neutral-800 bg-[#a9cfcb] text-lg font-bold text-white transition hover:bg-[#98c5c0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6aa7a1]"
        disabled={isLoading}
      >
        {isLoading ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
