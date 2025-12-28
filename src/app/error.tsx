"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/layout/back-button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを記録（全ての環境で開発者向けエラーフィードバックを表示）
    console.error("Application error:", error);
    if (error.stack) {
      console.error("Error stack trace:", error.stack);
    }
    if (error.digest) {
      console.error("Error digest:", error.digest);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-300 shadow-lg">
        <CardHeader className="bg-red-50 border-b border-red-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-700 shrink-0" aria-hidden="true" />
            <CardTitle className="text-xl font-bold text-red-900">
              エラーが発生しました
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-base text-slate-900">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {error.message && (
              <p className="text-base text-slate-700 mt-2 p-3 bg-slate-100 rounded-md font-mono break-words">
                {error.message}
              </p>
            )}
            {error.digest && (
              <p className="text-base text-slate-600 mt-2">
                エラーID: <span className="font-mono">{error.digest}</span>
              </p>
            )}
            {error.stack && (
              <details className="mt-4">
                <summary className="text-base text-slate-700 cursor-pointer font-medium">
                  スタックトレース（開発者向け）
                </summary>
                <pre className="text-sm text-slate-600 mt-2 p-3 bg-slate-100 rounded-md font-mono break-words whitespace-pre-wrap overflow-auto max-h-64">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={reset}
              className="flex-1 h-12 text-base font-medium gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              aria-label="再試行"
            >
              <RefreshCw className="h-5 w-5 shrink-0" aria-hidden="true" />
              再試行
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="flex-1 h-12 text-base font-medium gap-2 border-slate-300"
              aria-label="トップページへ戻る"
            >
              <Home className="h-5 w-5 shrink-0" aria-hidden="true" />
              トップへ戻る
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <BackButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

