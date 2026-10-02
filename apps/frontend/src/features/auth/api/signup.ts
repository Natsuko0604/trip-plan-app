// 新規会員登録用にPOST /signup を呼ぶ関数

import { SignupPostInput } from "@tripla/validation";

export const signupPost = async (data: SignupPostInput) => {
  const APIBASEURL = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!APIBASEURL) {
    throw new Error("API接続先が未設定です");
  }
  const url = `${APIBASEURL}/signup`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("サーバーで予期せぬエラーが発生しました");
    }
    return await res.json();
  } catch (e) {
    console.error(e);
  }
};
