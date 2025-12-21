"use client";

/**
 * 検索履歴の管理
 */

const SEARCH_HISTORY_KEY = "repair-shop-search-history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * 検索履歴を取得
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as SearchHistoryItem[];
    // 古い履歴を削除（30日以上前）
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return history.filter((item) => item.timestamp > thirtyDaysAgo);
  } catch (error) {
    console.error("[SearchHistory] 履歴の取得に失敗:", error);
    return [];
  }
}

/**
 * 検索履歴に追加
 */
export function addSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  if (!query.trim()) return;

  try {
    const history = getSearchHistory();
    
    // 既存の同じクエリを削除
    const filtered = history.filter((item) => item.query !== query);
    
    // 新しいクエリを先頭に追加
    const newHistory: SearchHistoryItem[] = [
      { query: query.trim(), timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("[SearchHistory] 履歴の保存に失敗:", error);
  }
}

/**
 * 検索履歴をクリア
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("[SearchHistory] 履歴の削除に失敗:", error);
  }
}





