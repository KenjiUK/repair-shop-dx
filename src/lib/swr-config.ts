/**
 * SWRグローバル設定
 * 
 * アプリ全体で使用するSWRのデフォルト設定
 * パフォーマンス最適化のため、キャッシュ戦略を統一
 */

import { SWRConfiguration } from "swr";

/**
 * SWRグローバル設定
 * 
 * 設定内容:
 * - dedupingInterval: 5分（重複リクエストを抑制）
 * - revalidateOnFocus: false（フォーカス時の再検証を無効化、オフライン対応）
 * - revalidateOnMount: 条件付き（キャッシュがない場合のみ再検証）
 * - revalidateOnReconnect: true（再接続時に再検証、オフライン対応）
 * - keepPreviousData: true（データ更新時のスムーズな遷移）
 * - errorRetryCount: 3（エラー時のリトライ回数）
 * - errorRetryInterval: 5000（リトライ間隔5秒）
 * - shouldRetryOnError: オフライン時はリトライしない（無限ループ防止）
 */
export const swrGlobalConfig: SWRConfiguration = {
  // 重複リクエストを5分間抑制（パフォーマンス向上）
  dedupingInterval: 5 * 60 * 1000, // 5分
  
  // フォーカス時の再検証を無効化（オフライン対応、パフォーマンス向上）
  revalidateOnFocus: false,
  
  // マウント時の再検証は条件付き（キャッシュがない場合のみ）
  // 注意: 各useSWR呼び出しで個別に設定可能
  revalidateOnMount: true, // 初回のみ、またはキャッシュがない場合のみ
  
  // 再接続時に再検証（オフライン対応）
  revalidateOnReconnect: true,
  
  // データ更新時のスムーズな遷移（UX向上）
  keepPreviousData: true,
  
  // エラー時のリトライ設定
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5秒
  
  // オフライン時はリトライしない（無限ループ防止）
  shouldRetryOnError: (error: Error) => {
    // オフライン状態の場合はリトライしない
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    // ネットワークエラーの場合はリトライしない（オフライン状態を検知できない場合のフォールバック）
    if (error?.message && /network|connection|failed/i.test(error.message)) {
      return false;
    }
    // その他のエラーはリトライする（最大3回まで）
    return true;
  },
  
  // フォーカス時の再検証を5分ごとに制限（パフォーマンス向上）
  focusThrottleInterval: 5 * 60 * 1000, // 5分
};

/**
 * ページ固有のSWR設定（必要に応じて使用）
 */
export const swrPageConfig = {
  // ホームページ用（頻繁に更新されるデータ）
  home: {
    ...swrGlobalConfig,
    dedupingInterval: 2 * 60 * 1000, // 2分（より頻繁に更新）
  },
  
  // 詳細ページ用（比較的静的なデータ）
  detail: {
    ...swrGlobalConfig,
    dedupingInterval: 10 * 60 * 1000, // 10分（より長くキャッシュ）
    revalidateOnMount: false, // キャッシュがあれば再検証しない
  },
  
  // マスタデータ用（非常に静的なデータ）
  master: {
    ...swrGlobalConfig,
    dedupingInterval: 30 * 60 * 1000, // 30分（非常に長くキャッシュ）
    revalidateOnMount: false,
    revalidateOnFocus: false,
  },
};




