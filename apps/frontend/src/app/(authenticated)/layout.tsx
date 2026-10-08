// 認証チェック
"use client";

import "@/lib/amplify";
import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export default function AuthCheck({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (e) {
        console.error(e);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, [router]);

  if (loading) {
    return <p>認証中...</p>;
  }
  if (!isAuthenticated) {
    return null; // 一時的にnullを返す(初期値(false)からエラー表示になるのを防ぐ / childrenが表示されるのを防ぐため)
  }
  return children;
}
