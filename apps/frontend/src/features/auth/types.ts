import { ReactNode } from "react";

// 汎用的な文字入力
export type TextFieldProps = {
  label: string;
  name: string;
  type?: "email" | "text";
  autoComplete: string;
};

// 既存・新規パスワード
export type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
};

// ログイン・会員登録ページの共通点
export type AuthPageShellProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: ReactNode;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
  children: ReactNode;
};
