// 画像URL用
import { authenticatedFetch } from "@/lib/auth-fetch";
import { ImageUploadUrlPostInput } from "@tripla/validation";

export const imageUploadUrlPost = async (data: ImageUploadUrlPostInput) => {
  const APIBASEURL = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!APIBASEURL) {
    throw new Error("API接続先が未設定です");
  }
  const url = `${APIBASEURL}/self/images/upload-url`;
  try {
    const res = await authenticatedFetch(url, {
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
    throw e;
  }
};
