// 認証済みユーザーのAPI通信用の認証トークン付与処理

import { fetchAuthSession } from "aws-amplify/auth";

// fetchAuthSessionによるトークン取得
export const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (!idToken) {
      throw new Error("トークンが見つかりません");
    }
    return idToken.toString();
  } catch (error) {
    console.error("トークン取得に失敗しました", error);
    throw error;
  }
};

// fetchへのヘッダー付与
export const authenticatedFetch = async (url: string, options: RequestInit) => {
  const getIdToken = await getAuthToken();
  const headers = new Headers(options.headers); // 編集できるHeadersオブジェクトとしてコピー
  headers.set("Authorization", getIdToken); // Authorizationという項目とトークンの値を追加
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error("APIリクエストに失敗しました");
  return res;
};
