/**
 * 顧客(Contacts)モジュール更新制約
 *
 * 直接更新NGフィールドのバリデーションとDescriptionへの追記
 */

import { ZohoCustomer } from "@/types";

// =============================================================================
// 直接更新NGフィールド定義
// =============================================================================

/**
 * 直接更新NGフィールドのリスト
 * これらのフィールドを更新しようとした場合、Descriptionに追記する
 */
export const READ_ONLY_FIELDS = [
  "Mailing_Street", // 住所 - 町名・番地
  "field4", // 住所 - 番地
  "field6", // 住所 - 建物名等
  "Phone", // 電話番号
  "Mobile", // 携帯番号
  "Email", // メールアドレス
] as const;

export type ReadOnlyField = (typeof READ_ONLY_FIELDS)[number];

/**
 * フィールドの表示名
 */
export const FIELD_DISPLAY_NAMES = {
  Mailing_Street: "住所（町名・番地）",
  field4: "住所（番地）",
  field6: "住所（建物名等）",
  Phone: "電話番号",
  Mobile: "携帯番号",
  Email: "メールアドレス",
} as const satisfies Record<ReadOnlyField, string>;

// =============================================================================
// フィールド更新権限チェック
// =============================================================================

/**
 * フィールドが直接更新可能かどうかをチェック
 */
export function isFieldUpdatable(fieldName: string): boolean {
  return !READ_ONLY_FIELDS.includes(fieldName as ReadOnlyField);
}

/**
 * 更新データに直接更新NGフィールドが含まれているかチェック
 */
export function hasReadOnlyFields(
  updateData: Partial<ZohoCustomer>
): ReadOnlyField[] {
  const readOnlyFields: ReadOnlyField[] = [];

  for (const field of READ_ONLY_FIELDS) {
    if (field in updateData && updateData[field as keyof ZohoCustomer] !== undefined) {
      readOnlyFields.push(field);
    }
  }

  return readOnlyFields;
}

/**
 * 更新データから直接更新NGフィールドを抽出
 */
export function extractReadOnlyFields(
  updateData: Partial<ZohoCustomer>
): Partial<Record<ReadOnlyField, unknown>> {
  const readOnlyData: Partial<Record<ReadOnlyField, unknown>> = {};

  for (const field of READ_ONLY_FIELDS) {
    if (field in updateData && updateData[field as keyof ZohoCustomer] !== undefined) {
      readOnlyData[field] = updateData[field as keyof ZohoCustomer];
    }
  }

  return readOnlyData;
}

/**
 * 更新データから直接更新NGフィールドを除外
 */
export function removeReadOnlyFields(
  updateData: Partial<ZohoCustomer>
): Partial<ZohoCustomer> {
  const allowedData: Partial<ZohoCustomer> = { ...updateData };

  for (const field of READ_ONLY_FIELDS) {
    delete allowedData[field as keyof ZohoCustomer];
  }

  return allowedData;
}
























