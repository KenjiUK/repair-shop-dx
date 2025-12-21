/**
 * エラーランプ情報パーサー
 * 
 * Zoho CRMのfield7（詳細情報）からエラーランプ情報を抽出
 */

import { ErrorLampInfo, ErrorLampType, ERROR_LAMP_TYPES } from "./error-lamp-types";

/**
 * field7（詳細情報）からエラーランプ情報を抽出
 * 
 * フォーマット:
 * 【エラーランプ情報】
 * エラーランプの種類: エンジンチェック, ABS, ...
 * その他の詳細: ...
 * 
 * @param field7 Zoho CRMのfield7（詳細情報）フィールド
 * @returns エラーランプ情報（見つからない場合はnull）
 */
export function parseErrorLampInfoFromField7(field7: string | null | undefined): ErrorLampInfo | null {
  if (!field7) return null;

  // 【エラーランプ情報】セクションを検索
  const errorLampSectionMatch = field7.match(/【エラーランプ情報】\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (!errorLampSectionMatch) return null;

  const errorLampSection = errorLampSectionMatch[1];

  // エラーランプの種類を抽出
  const lampTypesMatch = errorLampSection.match(/エラーランプの種類:\s*(.+)/);
  if (!lampTypesMatch) return null;

  const lampTypesString = lampTypesMatch[1].trim();
  const lampTypes: ErrorLampType[] = lampTypesString
    .split(",")
    .map((type) => type.trim())
    .filter((type): type is ErrorLampType => ERROR_LAMP_TYPES.includes(type as ErrorLampType));

  // その他の詳細を抽出
  const otherDetailsMatch = errorLampSection.match(/その他の詳細:\s*(.+)/);
  const otherDetails = otherDetailsMatch ? otherDetailsMatch[1].trim() : undefined;

  return {
    hasErrorLamp: true,
    lampTypes,
    otherDetails,
  };
}
