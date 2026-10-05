"use client";

import "@/lib/amplify";
import type { SubmitEvent } from "react";
import { PasswordField, TextField } from "./auth-fields";
import { signIn } from "aws-amplify/auth";

export function LoginForm() {
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    await signIn({
      username: email,
      password: password,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
      />
      <div>
        <PasswordField autoComplete="current-password" />
        <button
          type="button"
          className="ml-auto mt-2 block text-sm text-neutral-500 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bbfba]"
        >
          パスワードお忘れの方はこちら
        </button>
      </div>
      <button
        type="submit"
        className="mt-8 h-14 w-full rounded-xl border border-neutral-800 bg-[#a9cfcb] text-lg font-bold text-white transition hover:bg-[#98c5c0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6aa7a1]"
      >
        ログインする
      </button>
    </form>
  );
}
