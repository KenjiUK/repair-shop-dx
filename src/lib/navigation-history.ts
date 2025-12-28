/**
 * ナビゲーション履歴管理ユーティリティ
 * 
 * セッションストレージを使用して、作業フロー（診断→見積→作業）の遷移履歴を管理します。
 * これにより、「戻る」ボタンで適切な前の画面に戻ることができます。
 */

const NAV_HISTORY_KEY = "repair-shop-nav-history";
const CURRENT_PATH_KEY = "repair-shop-current-path";

interface NavigationHistory {
  /** 前の画面のパス */
  previousPath: string | null;
  /** 遷移元のページタイプ */
  referrerType: "top" | "diagnosis" | "estimate" | "work" | "other" | null;
  /** 前の画面のjobId（一致チェック用） */
  previousJobId: string | null;
}

/**
 * パスからjobIdを抽出
 */
function extractJobIdFromPath(pathname: string): string | null {
  // パターン: /mechanic/diagnosis/[jobId], /admin/estimate/[jobId], /mechanic/work/[jobId]
  const match = pathname.match(/\/(?:mechanic|admin)\/(?:diagnosis|estimate|work)\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * ナビゲーション履歴を取得
 */
export function getNavigationHistory(): NavigationHistory {
  if (typeof window === "undefined") {
    return { previousPath: null, referrerType: null, previousJobId: null };
  }

  try {
    const stored = sessionStorage.getItem(NAV_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NavigationHistory;
      // 後方互換性のため、previousJobIdがない場合はパスから抽出
      if (!parsed.previousJobId && parsed.previousPath) {
        parsed.previousJobId = extractJobIdFromPath(parsed.previousPath);
      }
      return parsed;
    }
  } catch (error) {
    console.error("[NavigationHistory] Failed to get history:", error);
  }

  return { previousPath: null, referrerType: null, previousJobId: null };
}

/**
 * ナビゲーション履歴を設定
 */
export function setNavigationHistory(previousPath: string, referrerType: NavigationHistory["referrerType"]): void {
  if (typeof window === "undefined") return;

  try {
    const previousJobId = extractJobIdFromPath(previousPath);
    const history: NavigationHistory = {
      previousPath,
      referrerType,
      previousJobId,
    };
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
    
    if (process.env.NODE_ENV === "development") {
      console.log("[NavigationHistory] History saved:", history);
    }
  } catch (error) {
    console.error("[NavigationHistory] Failed to set history:", error);
  }
}

/**
 * ナビゲーション履歴をクリア
 */
export function clearNavigationHistory(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(NAV_HISTORY_KEY);
  } catch (error) {
    console.error("[NavigationHistory] Failed to clear history:", error);
  }
}

/**
 * 現在のパスからページタイプを判定
 */
export function getPageTypeFromPath(pathname: string): NavigationHistory["referrerType"] {
  if (pathname === "/") return "top";
  if (pathname.startsWith("/mechanic/diagnosis/")) return "diagnosis";
  if (pathname.startsWith("/admin/estimate/")) return "estimate";
  if (pathname.startsWith("/mechanic/work/")) return "work";
  if (pathname.startsWith("/presentation/")) return "work"; // 整備完了レポートは作業ページから遷移
  if (pathname.startsWith("/customer/approval/")) return "estimate"; // 顧客承認ページは見積ページから遷移
  return "other";
}

/**
 * 現在のパスを保存（次回のページ読み込み時に前のパスとして使用）
 */
export function saveCurrentPath(pathname: string, search?: string): void {
  if (typeof window === "undefined") return;

  try {
    const currentPath = pathname + (search || "");
    sessionStorage.setItem(CURRENT_PATH_KEY, currentPath);
    
    if (process.env.NODE_ENV === "development") {
      console.log("[NavigationHistory] Current path saved:", currentPath);
    }
  } catch (error) {
    console.error("[NavigationHistory] Failed to save current path:", error);
  }
}

/**
 * 戻る先のパスを取得（履歴に基づく）
 * 履歴がない場合や、トップページから来た場合は "/" を返す
 */
export function getBackHref(jobId?: string): string {
  const history = getNavigationHistory();

  // 履歴がない場合はトップページに戻る
  if (!history.previousPath || !history.referrerType) {
    return "/";
  }

  // トップページから来た場合はトップページに戻る
  if (history.referrerType === "top") {
    return "/";
  }

  // jobIdが指定されている場合、一致チェックを行う
  if (jobId) {
    // 前の画面のjobIdと一致する場合のみ、前の画面に戻る
    if (history.previousJobId === jobId) {
      return history.previousPath;
    }
    
    // jobIdが一致しない場合でも、作業フロー内（diagnosis, estimate, work）の場合は前の画面に戻る
    // （同じ案件の異なる作業タイプやワークオーダーで遷移する場合があるため）
    if (history.referrerType === "diagnosis" || history.referrerType === "estimate" || history.referrerType === "work") {
      // 前の画面のパスからjobIdを抽出して比較
      const previousJobId = extractJobIdFromPath(history.previousPath);
      if (previousJobId === jobId) {
        return history.previousPath;
      }
    }
    
    // jobIdが一致しない場合は、トップページに戻る（別の案件）
    return "/";
  }

  // jobIdが未指定の場合は、履歴に基づいて前の画面に戻る
  // ただし、作業フロー内（diagnosis, estimate, work）の場合は、より慎重にチェック
  if (history.referrerType === "diagnosis" || history.referrerType === "estimate" || history.referrerType === "work") {
    // 作業フロー内の場合は、前の画面が有効かどうかを確認
    // （例: 診断ページから見積ページ、見積ページから作業ページなど）
    return history.previousPath;
  }

  // その他の場合は前の画面に戻る
  return history.previousPath;
}

