import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      imageSrc="/images/app/icon.png"
      imageAlt="アプリアイコンを表示できませんでした"
      title="ログイン"
      description="こんにちは、次の旅行計画を立てましょう"
      alternateText="まだアカウントをお持ちではない方はこちら"
      alternateHref="/signup"
      alternateLabel="新規会員登録"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
