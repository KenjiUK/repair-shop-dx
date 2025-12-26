/**
 * Dirty Check（未保存変更の検知）ユーティリティ
 * 
 * フォーム入力中に変更があった場合、ページ遷移やブラウザを閉じる前に確認ダイアログを表示します。
 */

"use client";

import { useEffect, useRef } from "react";

/**
 * Dirty Checkフック
 * 
 * @param hasUnsavedChanges - 未保存の変更があるかどうか
 * @param options - オプション設定
 */
export function useDirtyCheck(
  hasUnsavedChanges: boolean,
  options?: {
    /** 確認メッセージ（カスタム） */
    message?: string;
    /** 無効化フラグ */
    disabled?: boolean;
  }
) {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // hasUnsavedChangesを常に最新の値に更新
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // beforeunloadイベントで確認ダイアログを表示（ブラウザを閉じる/リロードする場合）
  useEffect(() => {
    if (options?.disabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        // 標準的なブラウザ確認ダイアログを表示
        e.preventDefault();
        // 現代のブラウザでは、returnValueに値を設定することで確認ダイアログが表示される
        // ただし、カスタムメッセージは表示されない（ブラウザのセキュリティポリシー）
        e.returnValue = options?.message || "";
        return options?.message || "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [options?.disabled, options?.message]);

  /**
   * ページ遷移を実行する前に確認ダイアログを表示
   * 
   * @returns 遷移を実行するかどうか（true: 実行する、false: キャンセル）
   */
  const confirmNavigation = (): boolean => {
    if (options?.disabled) return true;
    
    if (hasUnsavedChangesRef.current) {
      return window.confirm(
        options?.message || 
        "入力中の内容が保存されていません。このまま移動しますか？"
      );
    }
    
    return true;
  };

  return {
    confirmNavigation,
  };
}