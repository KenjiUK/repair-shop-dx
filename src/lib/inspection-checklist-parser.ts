/**
 * 車検チェックリスト情報パーサー
 * 
 * Zoho CRMのfield7（詳細情報）から車検チェックリスト情報を抽出・保存
 */

import { InspectionChecklist } from "@/types";

/**
 * field7（詳細情報）から車検チェックリスト情報を抽出
 * 
 * フォーマット:
 * 【車検チェックリスト】
 * 入庫時:
 * - 車検証: true/false
 * - 自賠責: true/false
 * - 自動車税: true/false
 * - 鍵: true/false
 * - ホイールロックナット: true/false
 * - ETCカード: true/false
 * - 貴重品: true/false
 * 入庫時備考: ...
 * 入庫時チェック完了日時: 2025-01-15T14:00:00+09:00
 * 
 * 出庫時:
 * - 車検証: true/false
 * - 自動車検査証記録事項: true/false
 * - 自賠責: true/false
 * - 記録簿: true/false
 * - 鍵: true/false
 * - ホイールロックナット: true/false
 * - ETCカード抜き忘れ: true/false
 * - ホイール増し締め: true/false
 * 出庫時備考: ...
 * 出庫時チェック完了日時: 2025-01-15T14:00:00+09:00
 * 
 * @param field7 Zoho CRMのfield7（詳細情報）フィールド
 * @param jobId ジョブID
 * @returns 車検チェックリスト情報（見つからない場合はnull）
 */
export function parseInspectionChecklistFromField7(
  field7: string | null | undefined,
  jobId: string
): InspectionChecklist | null {
  if (!field7) return null;

  // 【車検チェックリスト】セクションを検索
  const checklistSectionMatch = field7.match(/【車検チェックリスト】\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (!checklistSectionMatch) return null;

  const checklistSection = checklistSectionMatch[1];

  // 入庫時チェック項目を抽出
  const entryItems: InspectionChecklist["entryItems"] = {
    vehicleRegistration: /車検証:\s*(true|false)/.test(checklistSection) 
      ? checklistSection.match(/車検証:\s*(true|false)/)?.[1] === "true" 
      : false,
    compulsoryInsurance: /自賠責:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/自賠責:\s*(true|false)/)?.[1] === "true"
      : false,
    automobileTax: /自動車税:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/自動車税:\s*(true|false)/)?.[1] === "true"
      : false,
    key: /鍵:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/鍵:\s*(true|false)/)?.[1] === "true"
      : false,
    wheelLockNut: /ホイールロックナット:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/ホイールロックナット:\s*(true|false)/)?.[1] === "true"
      : false,
    etcCard: /ETCカード:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/ETCカード:\s*(true|false)/)?.[1] === "true"
      : false,
    valuables: /貴重品:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/貴重品:\s*(true|false)/)?.[1] === "true"
      : false,
  };

  // 出庫時チェック項目を抽出
  const checkoutItems: InspectionChecklist["checkoutItems"] = {
    vehicleRegistration: /出庫時.*?車検証:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/出庫時.*?車検証:\s*(true|false)/)?.[1] === "true"
      : false,
    inspectionRecord: /自動車検査証記録事項:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/自動車検査証記録事項:\s*(true|false)/)?.[1] === "true"
      : false,
    compulsoryInsurance: /出庫時.*?自賠責:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/出庫時.*?自賠責:\s*(true|false)/)?.[1] === "true"
      : false,
    recordBook: /記録簿:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/記録簿:\s*(true|false)/)?.[1] === "true"
      : false,
    key: /出庫時.*?鍵:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/出庫時.*?鍵:\s*(true|false)/)?.[1] === "true"
      : false,
    wheelLockNut: /出庫時.*?ホイールロックナット:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/出庫時.*?ホイールロックナット:\s*(true|false)/)?.[1] === "true"
      : false,
    etcCardRemoved: /ETCカード抜き忘れ:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/ETCカード抜き忘れ:\s*(true|false)/)?.[1] === "true"
      : false,
    wheelTightening: /ホイール増し締め:\s*(true|false)/.test(checklistSection)
      ? checklistSection.match(/ホイール増し締め:\s*(true|false)/)?.[1] === "true"
      : false,
  };

  // 備考を抽出
  const entryNoteMatch = checklistSection.match(/入庫時備考:\s*(.+?)(?=\n|$)/);
  const entryNote = entryNoteMatch ? entryNoteMatch[1].trim() : null;

  const checkoutNoteMatch = checklistSection.match(/出庫時備考:\s*(.+?)(?=\n|$)/);
  const checkoutNote = checkoutNoteMatch ? checkoutNoteMatch[1].trim() : null;

  // チェック完了日時を抽出
  const entryCheckedAtMatch = checklistSection.match(/入庫時チェック完了日時:\s*(.+?)(?=\n|$)/);
  const entryCheckedAt = entryCheckedAtMatch ? entryCheckedAtMatch[1].trim() : null;

  const checkoutCheckedAtMatch = checklistSection.match(/出庫時チェック完了日時:\s*(.+?)(?=\n|$)/);
  const checkoutCheckedAt = checkoutCheckedAtMatch ? checkoutCheckedAtMatch[1].trim() : null;

  return {
    jobId,
    entryItems,
    checkoutItems,
    entryNote: entryNote || null,
    checkoutNote: checkoutNote || null,
    entryCheckedAt: entryCheckedAt || null,
    checkoutCheckedAt: checkoutCheckedAt || null,
  };
}

/**
 * field7（詳細情報）に車検チェックリスト情報を追加
 * 
 * 既存の内容を保持しつつ、車検チェックリスト情報を追加または更新
 * 
 * @param field7 既存のfield7の内容
 * @param checklist 車検チェックリスト情報
 * @returns 更新後のfield7の内容
 */
export function appendInspectionChecklistToField7(
  field7: string | null | undefined,
  checklist: InspectionChecklist
): string {
  const existingContent = field7 || "";
  
  // 既存の車検チェックリストセクションを削除
  const withoutChecklist = existingContent.replace(
    /【車検チェックリスト】\s*\n[\s\S]*?(?=\n\n|$)/g,
    ""
  ).trim();

  // 車検チェックリスト情報を追加
  const checklistSection = `【車検チェックリスト】
入庫時:
- 車検証: ${checklist.entryItems.vehicleRegistration}
- 自賠責: ${checklist.entryItems.compulsoryInsurance}
- 自動車税: ${checklist.entryItems.automobileTax}
- 鍵: ${checklist.entryItems.key}
- ホイールロックナット: ${checklist.entryItems.wheelLockNut}
- ETCカード: ${checklist.entryItems.etcCard}
- 貴重品: ${checklist.entryItems.valuables}
${checklist.entryNote ? `入庫時備考: ${checklist.entryNote}` : ""}
${checklist.entryCheckedAt ? `入庫時チェック完了日時: ${checklist.entryCheckedAt}` : ""}

出庫時:
- 車検証: ${checklist.checkoutItems.vehicleRegistration}
- 自動車検査証記録事項: ${checklist.checkoutItems.inspectionRecord}
- 自賠責: ${checklist.checkoutItems.compulsoryInsurance}
- 記録簿: ${checklist.checkoutItems.recordBook}
- 鍵: ${checklist.checkoutItems.key}
- ホイールロックナット: ${checklist.checkoutItems.wheelLockNut}
- ETCカード抜き忘れ: ${checklist.checkoutItems.etcCardRemoved}
- ホイール増し締め: ${checklist.checkoutItems.wheelTightening}
${checklist.checkoutNote ? `出庫時備考: ${checklist.checkoutNote}` : ""}
${checklist.checkoutCheckedAt ? `出庫時チェック完了日時: ${checklist.checkoutCheckedAt}` : ""}`;
  
  if (withoutChecklist) {
    return `${withoutChecklist}\n\n${checklistSection}`;
  } else {
    return checklistSection;
  }
}







