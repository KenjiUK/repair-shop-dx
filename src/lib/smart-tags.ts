/**
 * スマートタグ管理 Google Sheets API クライアント
 *
 * TagsシートとSessionsシートの読み込み・更新を管理
 *
 * ⚠️ 重要: マスタデータ（車両マスタ、顧客マスタ）とは異なり、
 * スマートタグ管理用のGoogle Sheetsは読み書き可能です。
 */

import { TagSheetRow, SessionSheetRow, TagStatus, SessionStatus, ApiResponse } from "@/types";

const SMART_TAGS_API_BASE_URL = "/api/smart-tags";
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SMART_TAGS_ID || "";
const SHEET_NAMES = { TAGS: "Tags", SESSIONS: "Sessions" } as const;

/**
 * スマートタグ管理 API エラー
 */
export class SmartTagsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "SmartTagsError";
  }
}

/**
 * エラーレスポンスをパース
 */
async function parseErrorResponse(
  response: Response
): Promise<SmartTagsError> {
  let errorData: { error?: { message?: string; code?: string } } = {};
  try {
    errorData = await response.json();
  } catch {
    // JSONパース失敗時は空オブジェクト
  }

  const message =
    errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
  const code = errorData.error?.code || `HTTP_${response.status}`;

  return new SmartTagsError(message, code, response.status);
}

// =============================================================================
// Tagsシート操作
// =============================================================================

/**
 * 全タグを取得
 */
export async function fetchAllTags(): Promise<TagSheetRow[]> {
  const response = await fetch(`${SMART_TAGS_API_BASE_URL}/tags`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<TagSheetRow[]> = await response.json();
  if (!result.success || !result.data) {
    throw new SmartTagsError(
      result.error?.message || "タグの取得に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * 利用可能なタグを取得
 */
export async function fetchAvailableTags(): Promise<TagSheetRow[]> {
  const allTags = await fetchAllTags();
  return allTags.filter((tag) => tag.ステータス === "available");
}

/**
 * タグIDでタグを取得
 */
export async function findTagById(tagId: string): Promise<TagSheetRow | null> {
  const response = await fetch(`${SMART_TAGS_API_BASE_URL}/tags/${tagId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<TagSheetRow> = await response.json();
  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * タグのステータスを更新
 */
export async function updateTagStatus(
  tagId: string,
  status: TagStatus
): Promise<TagSheetRow> {
  const response = await fetch(`${SMART_TAGS_API_BASE_URL}/tags/${tagId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ステータス: status }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<TagSheetRow> = await response.json();
  if (!result.success || !result.data) {
    throw new SmartTagsError(
      result.error?.message || "タグの更新に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

// =============================================================================
// Sessionsシート操作
// =============================================================================

/**
 * 全セッションを取得
 */
export async function fetchAllSessions(): Promise<SessionSheetRow[]> {
  const response = await fetch(`${SMART_TAGS_API_BASE_URL}/sessions`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<SessionSheetRow[]> = await response.json();
  if (!result.success || !result.data) {
    throw new SmartTagsError(
      result.error?.message || "セッションの取得に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * アクティブなセッションを取得
 */
export async function fetchActiveSessions(): Promise<SessionSheetRow[]> {
  const allSessions = await fetchAllSessions();
  return allSessions.filter((session) => session.ステータス === "active");
}

/**
 * タグIDでアクティブなセッションを取得
 */
export async function findActiveSessionByTagId(
  tagId: string
): Promise<SessionSheetRow | null> {
  const activeSessions = await fetchActiveSessions();
  return activeSessions.find((s) => s.タグID === tagId) || null;
}

/**
 * Job IDでアクティブなセッションを取得
 */
export async function findActiveSessionByJobId(
  jobId: string
): Promise<SessionSheetRow | null> {
  const activeSessions = await fetchActiveSessions();
  return activeSessions.find((s) => s.JobID === jobId) || null;
}

/**
 * セッションを作成
 */
export async function createSession(
  tagId: string,
  jobId: string
): Promise<SessionSheetRow> {
  const response = await fetch(`${SMART_TAGS_API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      タグID: tagId,
      JobID: jobId,
    }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<SessionSheetRow> = await response.json();
  if (!result.success || !result.data) {
    throw new SmartTagsError(
      result.error?.message || "セッションの作成に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * セッションを閉じる（closedに更新）
 */
export async function closeSession(sessionId: string): Promise<SessionSheetRow> {
  const response = await fetch(
    `${SMART_TAGS_API_BASE_URL}/sessions/${sessionId}/close`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<SessionSheetRow> = await response.json();
  if (!result.success || !result.data) {
    throw new SmartTagsError(
      result.error?.message || "セッションの閉鎖に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

// =============================================================================
// タグライフサイクル管理
// =============================================================================

/**
 * タグをJobに紐付ける
 * 
 * 処理フロー:
 * 1. 既存のactiveセッションをclosedに更新
 * 2. タグのステータスをin_useに更新
 * 3. 新規セッションを作成
 */
export async function linkTagToJob(
  tagId: string,
  jobId: string,
  maxRetries: number = 3
): Promise<{ tag: TagSheetRow; session: SessionSheetRow }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. 既存のactiveセッションを検索して閉じる
      const existingSession = await findActiveSessionByTagId(tagId);
      if (existingSession) {
        await closeSession(existingSession.セッションID);
      }

      // 2. タグのステータスをin_useに更新
      const updatedTag = await updateTagStatus(tagId, "in_use");

      // 3. 新規セッションを作成
      const newSession = await createSession(tagId, jobId);

      return { tag: updatedTag, session: newSession };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 同時編集エラーの場合はリトライ
      if (
        error instanceof SmartTagsError &&
        (error.code === "CONCURRENT_EDIT" || error.statusCode === 409)
      ) {
        // リトライ前に少し待機（指数バックオフ）
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
        continue;
      }

      // その他のエラーは即座にスロー
      throw error;
    }
  }

  throw new SmartTagsError(
    `タグの紐付けに失敗しました（${maxRetries}回リトライ後）: ${lastError?.message}`,
    "LINK_TAG_FAILED"
  );
}

/**
 * タグを解放する
 * 
 * 処理フロー:
 * 1. アクティブなセッションをclosedに更新
 * 2. タグのステータスをavailableに更新
 */
export async function releaseTag(
  tagId: string,
  maxRetries: number = 3
): Promise<{ tag: TagSheetRow; session: SessionSheetRow | null }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. アクティブなセッションを検索して閉じる
      const activeSession = await findActiveSessionByTagId(tagId);
      let closedSession: SessionSheetRow | null = null;

      if (activeSession) {
        closedSession = await closeSession(activeSession.セッションID);
      }

      // 2. タグのステータスをavailableに更新
      const updatedTag = await updateTagStatus(tagId, "available");

      return { tag: updatedTag, session: closedSession };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 同時編集エラーの場合はリトライ
      if (
        error instanceof SmartTagsError &&
        (error.code === "CONCURRENT_EDIT" || error.statusCode === 409)
      ) {
        // リトライ前に少し待機（指数バックオフ）
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
        continue;
      }

      // その他のエラーは即座にスロー
      throw error;
    }
  }

  throw new SmartTagsError(
    `タグの解放に失敗しました（${maxRetries}回リトライ後）: ${lastError?.message}`,
    "RELEASE_TAG_FAILED"
  );
}

// =============================================================================
// SWRキー生成
// =============================================================================

export function getTagsKey(): string {
  return `${SMART_TAGS_API_BASE_URL}/tags`;
}

export function getAvailableTagsKey(): string {
  return `${SMART_TAGS_API_BASE_URL}/tags?status=available`;
}

export function getTagByIdKey(tagId: string): string {
  return `${SMART_TAGS_API_BASE_URL}/tags/${tagId}`;
}

export function getSessionsKey(): string {
  return `${SMART_TAGS_API_BASE_URL}/sessions`;
}

export function getActiveSessionsKey(): string {
  return `${SMART_TAGS_API_BASE_URL}/sessions?status=active`;
}

export function getSessionByTagIdKey(tagId: string): string {
  return `${SMART_TAGS_API_BASE_URL}/sessions?tagId=${tagId}&status=active`;
}

export function getSessionByJobIdKey(jobId: string): string {
  return `${SMART_TAGS_API_BASE_URL}/sessions?jobId=${jobId}&status=active`;
}

















