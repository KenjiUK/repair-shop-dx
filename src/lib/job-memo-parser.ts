/**
 * 作業メモパーサー
 * 
 * Zoho CRMのfield26（作業メモ）からメモ情報を抽出・保存
 */

import { JobMemo } from "@/types";

/**
 * field26（作業メモ）からメモ配列を抽出
 * 
 * @param field26 Zoho CRMのfield26（作業メモ）フィールド（JSON形式）
 * @returns メモ配列（見つからない場合は空配列）
 */
export function parseJobMemosFromField26(field26: string | null | undefined): JobMemo[] {
  if (!field26) return [];

  try {
    const parsed = JSON.parse(field26);
    if (Array.isArray(parsed)) {
      return parsed as JobMemo[];
    }
    return [];
  } catch (error) {
    console.error("[JobMemo] field26パースエラー:", error);
    return [];
  }
}

/**
 * field26（作業メモ）にメモ配列を保存
 * 
 * @param memos メモ配列
 * @returns JSON形式の文字列
 */
export function stringifyJobMemosToField26(memos: JobMemo[]): string {
  return JSON.stringify(memos);
}

/**
 * メモを追加
 * 
 * @param existingMemos 既存のメモ配列
 * @param newMemo 新しいメモ
 * @returns 更新後のメモ配列
 */
export function addJobMemo(existingMemos: JobMemo[], newMemo: JobMemo): JobMemo[] {
  return [newMemo, ...existingMemos]; // 新しいメモを先頭に追加
}

/**
 * メモを更新
 * 
 * @param existingMemos 既存のメモ配列
 * @param memoId 更新するメモID
 * @param updatedContent 更新後のメモ内容
 * @returns 更新後のメモ配列
 */
export function updateJobMemo(
  existingMemos: JobMemo[],
  memoId: string,
  updatedContent: string
): JobMemo[] {
  return existingMemos.map((memo) =>
    memo.id === memoId
      ? {
          ...memo,
          content: updatedContent,
          updatedAt: new Date().toISOString(),
        }
      : memo
  );
}

/**
 * メモを削除
 * 
 * @param existingMemos 既存のメモ配列
 * @param memoId 削除するメモID
 * @returns 更新後のメモ配列
 */
export function deleteJobMemo(existingMemos: JobMemo[], memoId: string): JobMemo[] {
  return existingMemos.filter((memo) => memo.id !== memoId);
}

/**
 * 新しいメモを作成
 * 
 * @param jobId ジョブID
 * @param content メモ内容
 * @param author 作成者名
 * @returns 新しいメモ
 */
export function createNewJobMemo(
  jobId: string,
  content: string,
  author: string
): JobMemo {
  return {
    id: `memo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    jobId,
    content,
    author,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}







