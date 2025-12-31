"use client";

import { SWRConfig } from "swr";
import { swrGlobalConfig } from "@/lib/swr-config";
import { ReactNode } from "react";

/**
 * SWRプロバイダーコンポーネント
 * アプリ全体でSWRのグローバル設定を適用
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrGlobalConfig}>
      {children}
    </SWRConfig>
  );
}














