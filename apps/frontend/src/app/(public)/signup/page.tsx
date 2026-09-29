import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthPageShell
      imageSrc="/images/app/icon.png"
      imageAlt="アプリアイコンを表示できませんでした"
      title="アカウントを作成しましょう"
      description={
        <>
          以下の項目を入力する、
          <br />
          またはソーシャルアカウントを登録してください
        </>
      }
      alternateText="アカウントをお持ちの方はこちら"
      alternateHref="/login"
      alternateLabel="ログイン"
    >
      <SignupForm />
    </AuthPageShell>
  );
}
