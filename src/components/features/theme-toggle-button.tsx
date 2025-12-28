"use client";

/**
 * テーマ切り替えボタンコンポーネント
 * 
 * ダークモード/ライトモードを切り替えるボタン
 */

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleButtonProps {
  /** カスタムクラス名 */
  className?: string;
  /** サイズ（デフォルト: h-12 w-12） */
  size?: "default" | "sm" | "lg";
}

export function ThemeToggleButton({ className, size = "default" }: ThemeToggleButtonProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // マウント前は何も表示しない（ハイドレーションエラーを防ぐ）
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-12 w-12 shrink-0", className)}
        disabled
        aria-label="テーマを読み込み中"
      >
        <Sun className="h-6 w-6" />
      </Button>
    );
  }

  const sizeClasses = {
    default: "h-12 w-12",
    sm: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const iconSizeClasses = {
    default: "h-6 w-6",
    sm: "h-5 w-5",
    lg: "h-7 w-7",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(sizeClasses[size], "shrink-0", className)}
      aria-label={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
      title={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
    >
      {theme === "light" ? (
        <Moon className={iconSizeClasses[size]} />
      ) : (
        <Sun className={iconSizeClasses[size]} />
      )}
    </Button>
  );
}


