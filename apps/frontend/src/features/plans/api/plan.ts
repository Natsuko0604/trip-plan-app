// 旅行計画新規作成(POST)用の self/plans 呼び出す関数

import { SelfPlanPostInput } from "@tripla/validation";

export const plansPost = async (data: SelfPlanPostInput) => {
  const APIBASEURL = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!APIBASEURL) {
    throw new Error("API接続先が未設定です");
  }
  const url = `${APIBASEURL}/self/plans`;
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

// 旅行計画詳細の取得(GET)
// 旅行計画の基本情報の更新(PUT)
// 旅行計画の削除(DELETE)
