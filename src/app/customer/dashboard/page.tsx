"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * 顧客ダッシュボードページ（一時的に無効化）
 * Next.js 16の静的生成エラーを回避するため、一時的にシンプルなページに置き換え
 * TODO: window.locationを使用する動的ページの適切な実装方法を検討
 */
export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          顧客ダッシュボード
        </h1>
        <p className="text-slate-600 mb-4">
          このページは現在メンテナンス中です。
        </p>
        <p className="text-sm text-slate-500">
          顧客IDをURLパラメータで指定してください: /customer/dashboard?customerId=xxx
        </p>
      </div>
    </div>
  );
}
