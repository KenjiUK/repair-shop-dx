/**
 * スマートタグ管理用SWRフック
 *
 * Google Sheetsからスマートタグデータを取得し、SWRでキャッシュ管理
 * TTL: 1時間、再検証: フォーカス時または5分ごと
 */

import useSWR from "swr";
import {
  fetchAllTags,
  fetchAvailableTags,
  findTagById,
  getTagsKey,
  getAvailableTagsKey,
  getTagByIdKey,
  fetchAllSessions,
  fetchActiveSessions,
  findActiveSessionByTagId,
  findActiveSessionByJobId,
  getSessionsKey,
  getActiveSessionsKey,
  getSessionByTagIdKey,
  getSessionByJobIdKey,
} from "@/lib/smart-tags";
import { TagSheetRow, SessionSheetRow } from "@/types";

// =============================================================================
// SWR設定
// =============================================================================

/** SWR設定: TTL 1時間、再検証間隔 5分 */
const swrConfig = {
  revalidateOnFocus: true, // フォーカス時に再検証
  revalidateOnReconnect: true, // 再接続時に再検証
  dedupingInterval: 5 * 60 * 1000, // 5分間は重複リクエストを抑制
  focusThrottleInterval: 5 * 60 * 1000, // フォーカス時の再検証を5分ごとに制限
  errorRetryCount: 3, // エラー時のリトライ回数
  errorRetryInterval: 5000, // リトライ間隔（5秒）
};

// =============================================================================
// Tagsフック
// =============================================================================

/**
 * 全タグを取得（SWRキャッシュ付き）
 */
export function useSmartTags() {
  const key = getTagsKey();
  const { data, error, isLoading, mutate } = useSWR<TagSheetRow[]>(
    key,
    () => fetchAllTags(),
    swrConfig
  );

  return {
    tags: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate, // 手動で再検証する場合
  };
}

/**
 * 利用可能なタグを取得（SWRキャッシュ付き）
 */
export function useAvailableTags() {
  const key = getAvailableTagsKey();
  const { data, error, isLoading, mutate } = useSWR<TagSheetRow[]>(
    key,
    () => fetchAvailableTags(),
    swrConfig
  );

  return {
    tags: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * タグIDでタグを取得（SWRキャッシュ付き）
 */
export function useTagById(tagId: string | null) {
  const key = tagId ? getTagByIdKey(tagId) : null;
  const { data, error, isLoading, mutate } = useSWR<TagSheetRow | null>(
    key,
    () => (tagId ? findTagById(tagId) : Promise.resolve(null)),
    swrConfig
  );

  return {
    tag: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// =============================================================================
// Sessionsフック
// =============================================================================

/**
 * 全セッションを取得（SWRキャッシュ付き）
 */
export function useTagSessions() {
  const key = getSessionsKey();
  const { data, error, isLoading, mutate } = useSWR<SessionSheetRow[]>(
    key,
    () => fetchAllSessions(),
    swrConfig
  );

  return {
    sessions: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * アクティブなセッションを取得（SWRキャッシュ付き）
 */
export function useActiveTagSessions() {
  const key = getActiveSessionsKey();
  const { data, error, isLoading, mutate } = useSWR<SessionSheetRow[]>(
    key,
    () => fetchActiveSessions(),
    swrConfig
  );

  return {
    sessions: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * タグIDでアクティブなセッションを取得（SWRキャッシュ付き）
 */
export function useActiveSessionByTagId(tagId: string | null) {
  const key = tagId ? getSessionByTagIdKey(tagId) : null;
  const { data, error, isLoading, mutate } = useSWR<SessionSheetRow | null>(
    key,
    () => (tagId ? findActiveSessionByTagId(tagId) : Promise.resolve(null)),
    swrConfig
  );

  return {
    session: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Job IDでアクティブなセッションを取得（SWRキャッシュ付き）
 */
export function useActiveSessionByJobId(jobId: string | null) {
  const key = jobId ? getSessionByJobIdKey(jobId) : null;
  const { data, error, isLoading, mutate } = useSWR<SessionSheetRow | null>(
    key,
    () => (jobId ? findActiveSessionByJobId(jobId) : Promise.resolve(null)),
    swrConfig
  );

  return {
    session: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

























