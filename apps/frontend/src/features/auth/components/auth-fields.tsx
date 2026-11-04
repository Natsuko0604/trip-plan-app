"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { PasswordFieldProps, TextFieldProps } from "../types";
import { ErrorMessage } from "./error-message";

export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  errorMessage,
  onChange,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-neutral-500 sm:text-base"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        onChange={onChange}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? errorId : undefined}
        className="h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-[#83bbb5] focus:ring-3 focus:ring-[#83bbb5]/20"
      />
      {errorMessage && <ErrorMessage id={errorId} message={errorMessage} />}
    </div>
  );
}

export function PasswordField({
  autoComplete,
  required,
  errorMessage,
  onChange,
}: PasswordFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-neutral-500 sm:text-base"
      >
        パスワード
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          onChange={onChange}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          className="h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 pr-14 text-base text-neutral-900 outline-none transition focus:border-[#83bbb5] focus:ring-3 focus:ring-[#83bbb5]/20"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={
            isVisible ? "パスワードを非表示にする" : "パスワードを表示する"
          }
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-2 flex w-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8bbfba]"
        >
          <Image
            src={
              isVisible
                ? "/images/auth/visibility.svg"
                : "/images/auth/visibility-off.svg"
            }
            alt=""
            width={24}
            height={24}
          />
        </button>
      </div>
      {errorMessage && <ErrorMessage id={errorId} message={errorMessage} />}
    </div>
  );
}
