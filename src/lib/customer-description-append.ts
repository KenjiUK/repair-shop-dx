/**
 * 顧客(Contacts)モジュール Description追記ロジック
 *
 * 直接更新NGフィールドの変更要求をDescriptionフィールドに追記
 */

import { ZohoCustomer } from "@/types";
import {
  ReadOnlyField,
  FIELD_DISPLAY_NAMES,
  extractReadOnlyFields,
} from "./customer-field-validation";

// =============================================================================
// Description追記フォーマット
// =============================================================================

/**
 * 変更届フォーマット
 * 【アプリ変更届】YYYY-MM-DD HH:mm: 項目名: 変更前 → 変更後
 */
export function formatChangeRequest(
  fieldName: ReadOnlyField,
  oldValue: unknown,
  newValue: unknown
): string {
  const timestamp = new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const displayName = FIELD_DISPLAY_NAMES[fieldName];
  const oldValueStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : "（未設定）";
  const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : "（未設定）";

  return `【アプリ変更届】${timestamp}: ${displayName}: ${oldValueStr} → ${newValueStr}`;
}

/**
 * 複数の変更要求をフォーマット
 */
export function formatMultipleChangeRequests(
  changes: Array<{
    fieldName: ReadOnlyField;
    oldValue: unknown;
    newValue: unknown;
  }>
): string {
  return changes
    .map((change) => formatChangeRequest(change.fieldName, change.oldValue, change.newValue))
    .join("\n");
}

// =============================================================================
// Descriptionへの追記
// =============================================================================

/**
 * 顧客データのDescriptionに変更要求を追記
 */
export function appendChangeRequestToDescription(
  customer: ZohoCustomer,
  updateData: Partial<ZohoCustomer>
): string {
  const readOnlyFields = extractReadOnlyFields(updateData);
  const currentDescription = customer.Description || "";

  // 変更要求を生成
  const changeRequests = Object.entries(readOnlyFields).map(([fieldName, newValue]) => {
    const field = fieldName as ReadOnlyField;
    const oldValue = customer[field as keyof ZohoCustomer];

    return {
      fieldName: field,
      oldValue,
      newValue,
    };
  });

  if (changeRequests.length === 0) {
    return currentDescription;
  }

  // 変更要求をフォーマット
  const formattedRequests = formatMultipleChangeRequests(changeRequests);

  // Descriptionに追記（既存の内容がある場合は改行を追加）
  const separator = currentDescription ? "\n\n" : "";
  return `${currentDescription}${separator}${formattedRequests}`;
}

/**
 * Descriptionから変更要求を削除（対応完了時）
 */
export function removeChangeRequestsFromDescription(
  description: string | null
): string {
  if (!description) {
    return "";
  }

  // 【アプリ変更届】で始まる行を削除
  return description
    .split("\n")
    .filter((line) => !line.trim().startsWith("【アプリ変更届】"))
    .join("\n")
    .trim();
}

/**
 * Descriptionに変更要求が含まれているかチェック
 */
export function hasChangeRequests(description: string | null): boolean {
  if (!description) {
    return false;
  }

  return description.includes("【アプリ変更届】");
}
















