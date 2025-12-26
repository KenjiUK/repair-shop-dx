/**
 * 一時帰宅情報パーサー
 * 
 * Zoho CRMのfield7（詳細情報）から一時帰宅情報を抽出
 */

/**
 * field7（詳細情報）から一時帰宅情報を抽出
 * 
 * フォーマット:
 * 【一時帰宅情報】
 * 再入庫予定日時: 2025-01-15T14:00:00+09:00
 * 
 * @param field7 Zoho CRMのfield7（詳細情報）フィールド
 * @returns 再入庫予定日時（見つからない場合はnull）
 */
export function parseTemporaryReturnInfoFromField7(field7: string | null | undefined): string | null {
  if (!field7) return null;

  // 【一時帰宅情報】セクションを検索
  const temporaryReturnSectionMatch = field7.match(/【一時帰宅情報】\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (!temporaryReturnSectionMatch) return null;

  const temporaryReturnSection = temporaryReturnSectionMatch[1];

  // 再入庫予定日時を抽出
  const reentryDateTimeMatch = temporaryReturnSection.match(/再入庫予定日時:\s*(.+)/);
  if (!reentryDateTimeMatch) return null;

  return reentryDateTimeMatch[1].trim();
}

/**
 * field7（詳細情報）に一時帰宅情報を追加
 * 
 * 既存の内容を保持しつつ、一時帰宅情報を追加または更新
 * 
 * @param field7 既存のfield7の内容
 * @param reentryDateTime 再入庫予定日時（ISO8601形式）
 * @returns 更新後のfield7の内容
 */
export function appendTemporaryReturnInfoToField7(
  field7: string | null | undefined,
  reentryDateTime: string | null
): string {
  const existingContent = field7 || "";
  
  // 既存の一時帰宅情報セクションを削除
  const withoutTemporaryReturn = existingContent.replace(
    /【一時帰宅情報】\s*\n[\s\S]*?(?=\n\n|$)/g,
    ""
  ).trim();

  // 一時帰宅情報を追加
  if (reentryDateTime) {
    const temporaryReturnSection = `【一時帰宅情報】\n再入庫予定日時: ${reentryDateTime}`;
    
    if (withoutTemporaryReturn) {
      return `${withoutTemporaryReturn}\n\n${temporaryReturnSection}`;
    } else {
      return temporaryReturnSection;
    }
  } else {
    // 一時帰宅情報を削除する場合
    return withoutTemporaryReturn;
  }
}







