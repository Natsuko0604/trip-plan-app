"use client";

import type { SubmitEvent } from "react";
import { PasswordField, TextField } from "./auth-fields";

export function SignupForm() {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
      />
      <PasswordField autoComplete="new-password" />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-500 sm:text-base">
        <input
          type="checkbox"
          name="privacyAccepted"
          className="mt-1 size-4 shrink-0 accent-[#83bbb5]"
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
      <button
        type="submit"
        className="mt-2 h-14 w-full rounded-xl border border-neutral-800 bg-[#a9cfcb] text-lg font-bold text-white transition hover:bg-[#98c5c0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6aa7a1]"
      >
        登録する
      </button>
    </form>
  );
}
