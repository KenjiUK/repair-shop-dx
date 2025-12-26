/**
 * フィードバックフローティングボタン
 * テスト版専用機能
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./feedback-dialog";
import { MessageSquare } from "lucide-react";
import { isFeedbackEnabled } from "@/lib/feedback-utils";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // テスト版のみ表示
  if (!isFeedbackEnabled()) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-[1000]",
          "h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-white", // bg-blue-600 → bg-primary (40歳以上ユーザー向け、統一)
          "flex items-center justify-center",
          "transition-all duration-200",
          "hover:scale-110 active:scale-95"
        )}
        aria-label="フィードバックを送信"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <FeedbackDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}



