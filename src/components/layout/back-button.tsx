"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDirtyCheck } from "@/lib/dirty-check";

interface BackButtonProps {
  /** 戻る先のURL（デフォルト: "/"） */
  href?: string;
  /** カスタムクラス */
  className?: string;
  /** テキストを非表示にするか（デフォルト: false） */
  hideText?: boolean;
  /** カスタムaria-label（デフォルト: hrefが"/"なら「トップページに戻る」、それ以外は「前の画面に戻る」） */
  ariaLabel?: string;
  /** 未保存の変更があるかどうか */
  hasUnsavedChanges?: boolean;
}

/**
 * 統一された戻るボタンコンポーネント
 * 全ページで一貫したデザインと動作を提供
 */
export function BackButton({ 
  href = "/", 
  className,
  hideText = false,
  ariaLabel,
  hasUnsavedChanges = false,
}: BackButtonProps) {
  const router = useRouter();
  const { confirmNavigation } = useDirtyCheck(hasUnsavedChanges, {
    message: "入力中の内容が保存されていません。このまま移動しますか？",
  });

  // aria-labelを動的に設定
  const defaultAriaLabel = href === "/" ? "トップページに戻る" : "前の画面に戻る";
  const label = ariaLabel || defaultAriaLabel;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // 未保存の変更がある場合は確認ダイアログを表示
    if (!confirmNavigation()) {
      return;
    }
    
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-base text-slate-800 hover:text-slate-900 transition-colors shrink-0",
        className
      )}
      aria-label={label}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" />
      {!hideText && <span>戻る</span>}
    </button>
  );
}



