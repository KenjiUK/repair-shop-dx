/**
 * 診断結果から見積項目への変換機能
 *
 * 車検診断結果から「要交換」「注意」と判定された項目を自動的に見積項目に追加
 * タイヤ交換・ローテーション診断結果から「要交換」「注意」と判定された項目を自動的に見積項目に追加
 * その他のメンテナンス診断結果から「要交換」「注意」と判定された項目を自動的に見積項目に追加
 * チューニング・パーツ取付診断結果から「要対応」「注意」と判定された項目を自動的に見積項目に追加
 * コーティング診断結果から「深刻な傷」「中程度の傷」「軽微な傷」と判定された項目を自動的に見積項目に追加
 */

import { InspectionItem } from "./inspection-items";
import { TireInspectionItem } from "./tire-inspection-items";
import { MaintenanceInspectionItemState } from "@/components/features/maintenance-inspection-view";
import { TuningPartsInspectionItem } from "@/components/features/tuning-parts-inspection-view";
import { BodyConditionCheck, BodyConditionStatus } from "@/components/features/coating-inspection-view";
import { EstimateItem, EstimatePriority } from "@/types";

// =============================================================================
// 診断結果から見積項目への変換
// =============================================================================

/**
 * 診断結果から見積項目を生成
 *
 * @param inspectionItems 検査項目リスト
 * @returns 見積項目リスト
 */
export function convertDiagnosisToEstimateItems(
  inspectionItems: InspectionItem[]
): EstimateItem[] {
  const estimateItems: EstimateItem[] = [];

  // 「要交換」「注意」と判定された項目を抽出
  const flaggedItems = inspectionItems.filter(
    (item) => item.status === "red" || item.status === "yellow"
  );

  for (const item of flaggedItems) {
    // 優先度を決定（要交換=必須、注意=推奨）
    const priority: EstimatePriority =
      item.status === "red" ? "required" : "recommended";

    // 見積項目を作成
    const estimateItem: EstimateItem = {
      id: `estimate-${item.id}`,
      name: item.name,
      price: 0, // 金額は手動入力（基幹システムから転記）
      priority,
      selected: priority === "required", // 必須項目は自動選択
      linkedPhotoUrls: item.photoUrls || [],
      linkedVideoUrl: item.videoUrl || null,
      note: item.comment || null,
    };

    estimateItems.push(estimateItem);
  }

  return estimateItems;
}

/**
 * タイヤ交換・ローテーション診断結果から見積項目を生成
 *
 * @param tireInspectionItems タイヤ検査項目リスト
 * @returns 見積項目リスト
 */
export function convertTireDiagnosisToEstimateItems(
  tireInspectionItems: TireInspectionItem[]
): EstimateItem[] {
  const estimateItems: EstimateItem[] = [];

  // 「要交換」「注意」と判定された項目を抽出
  const flaggedItems = tireInspectionItems.filter(
    (item) => item.status === "replace" || item.status === "attention"
  );

  for (const item of flaggedItems) {
    // 優先度を決定（要交換=必須、注意=推奨）
    const priority: EstimatePriority =
      item.status === "replace" ? "required" : "recommended";

    // 見積項目を作成
    const estimateItem: EstimateItem = {
      id: `estimate-${item.id}`,
      name: item.name,
      price: 0, // 金額は手動入力（基幹システムから転記）
      priority,
      selected: priority === "required", // 必須項目は自動選択
      linkedPhotoUrls: item.photoUrls || [],
      linkedVideoUrl: null,
      note: item.comment || null,
    };

    estimateItems.push(estimateItem);
  }

  return estimateItems;
}

/**
 * 診断結果から見積項目を追加（既存項目と重複チェック）
 *
 * @param existingItems 既存の見積項目リスト
 * @param inspectionItems 検査項目リスト
 * @returns 追加された見積項目リスト
 */
export function addDiagnosisItemsToEstimate(
  existingItems: EstimateItem[],
  inspectionItems: InspectionItem[]
): EstimateItem[] {
  const newItems = convertDiagnosisToEstimateItems(inspectionItems);
  const existingNames = new Set(existingItems.map((item) => item.name));

  // 重複を除外して追加
  const itemsToAdd = newItems.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...existingItems, ...itemsToAdd];
}

/**
 * タイヤ交換・ローテーション診断結果から見積項目を追加（既存項目と重複チェック）
 *
 * @param existingItems 既存の見積項目リスト
 * @param tireInspectionItems タイヤ検査項目リスト
 * @returns 追加された見積項目リスト
 */
export function addTireDiagnosisItemsToEstimate(
  existingItems: EstimateItem[],
  tireInspectionItems: TireInspectionItem[]
): EstimateItem[] {
  const newItems = convertTireDiagnosisToEstimateItems(tireInspectionItems);
  const existingNames = new Set(existingItems.map((item) => item.name));

  // 重複を除外して追加
  const itemsToAdd = newItems.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...existingItems, ...itemsToAdd];
}

/**
 * その他のメンテナンス診断結果から見積項目を生成
 *
 * @param maintenanceInspectionItems メンテナンス検査項目リスト
 * @returns 見積項目リスト
 */
export function convertMaintenanceDiagnosisToEstimateItems(
  maintenanceInspectionItems: MaintenanceInspectionItemState[]
): EstimateItem[] {
  const estimateItems: EstimateItem[] = [];

  // 「要交換」「注意」と判定された項目を抽出
  const flaggedItems = maintenanceInspectionItems.filter(
    (item) => item.status === "replace" || item.status === "attention"
  );

  for (const item of flaggedItems) {
    // 優先度を決定（要交換=必須、注意=推奨）
    const priority: EstimatePriority =
      item.status === "replace" ? "required" : "recommended";

    // 見積項目を作成
    const estimateItem: EstimateItem = {
      id: `estimate-${item.id}`,
      name: item.name,
      price: 0, // 金額は手動入力（基幹システムから転記）
      priority,
      selected: priority === "required", // 必須項目は自動選択
      linkedPhotoUrls: item.photoUrls || [],
      linkedVideoUrl: null,
      note: item.comment || null,
    };

    estimateItems.push(estimateItem);
  }

  return estimateItems;
}

/**
 * その他のメンテナンス診断結果から見積項目を追加（既存項目と重複チェック）
 *
 * @param existingItems 既存の見積項目リスト
 * @param maintenanceInspectionItems メンテナンス検査項目リスト
 * @returns 追加された見積項目リスト
 */
export function addMaintenanceDiagnosisItemsToEstimate(
  existingItems: EstimateItem[],
  maintenanceInspectionItems: MaintenanceInspectionItemState[]
): EstimateItem[] {
  const newItems = convertMaintenanceDiagnosisToEstimateItems(maintenanceInspectionItems);
  const existingNames = new Set(existingItems.map((item) => item.name));

  // 重複を除外して追加
  const itemsToAdd = newItems.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...existingItems, ...itemsToAdd];
}

/**
 * チューニング・パーツ取付診断結果から見積項目を生成
 *
 * @param tuningPartsInspectionItems チューニング・パーツ取付検査項目リスト
 * @returns 見積項目リスト
 */
export function convertTuningPartsDiagnosisToEstimateItems(
  tuningPartsInspectionItems: TuningPartsInspectionItem[]
): EstimateItem[] {
  const estimateItems: EstimateItem[] = [];

  // 「要対応」「注意」と判定された項目を抽出
  const flaggedItems = tuningPartsInspectionItems.filter(
    (item) => item.status === "replace" || item.status === "attention"
  );

  for (const item of flaggedItems) {
    // 優先度を決定（要対応=必須、注意=推奨）
    const priority: EstimatePriority =
      item.status === "replace" ? "required" : "recommended";

    // 見積項目を作成
    const estimateItem: EstimateItem = {
      id: `estimate-${item.id}`,
      name: item.name,
      price: 0, // 金額は手動入力（基幹システムから転記）
      priority,
      selected: priority === "required", // 必須項目は自動選択
      linkedPhotoUrls: item.photoUrls || [],
      linkedVideoUrl: null,
      note: item.comment || null,
    };

    estimateItems.push(estimateItem);
  }

  return estimateItems;
}

/**
 * チューニング・パーツ取付診断結果から見積項目を追加（既存項目と重複チェック）
 *
 * @param existingItems 既存の見積項目リスト
 * @param tuningPartsInspectionItems チューニング・パーツ取付検査項目リスト
 * @returns 追加された見積項目リスト
 */
export function addTuningPartsDiagnosisItemsToEstimate(
  existingItems: EstimateItem[],
  tuningPartsInspectionItems: TuningPartsInspectionItem[]
): EstimateItem[] {
  const newItems = convertTuningPartsDiagnosisToEstimateItems(tuningPartsInspectionItems);
  const existingNames = new Set(existingItems.map((item) => item.name));

  // 重複を除外して追加
  const itemsToAdd = newItems.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...existingItems, ...itemsToAdd];
}

/**
 * コーティング診断結果から見積項目を生成
 *
 * @param bodyConditions 車体状態確認結果リスト
 * @returns 見積項目リスト
 */
export function convertCoatingDiagnosisToEstimateItems(
  bodyConditions: BodyConditionCheck[]
): EstimateItem[] {
  const estimateItems: EstimateItem[] = [];

  // 「深刻な傷」「中程度の傷」「軽微な傷」と判定された項目を抽出
  const flaggedItems = bodyConditions.filter(
    (item) => item.condition === "深刻な傷" || item.condition === "中程度の傷" || item.condition === "軽微な傷"
  );

  for (const item of flaggedItems) {
    // 優先度を決定（深刻な傷=必須、中程度の傷=必須、軽微な傷=推奨）
    const priority: EstimatePriority =
      item.condition === "深刻な傷" || item.condition === "中程度の傷" ? "required" : "recommended";

    // 見積項目を作成（下地処理が必要な場合）
    const estimateItem: EstimateItem = {
      id: `estimate-${item.id}`,
      name: `${item.location}の下地処理`,
      price: 0, // 金額は手動入力（基幹システムから転記）
      priority,
      selected: priority === "required", // 必須項目は自動選択
      linkedPhotoUrls: item.photoUrls || [],
      linkedVideoUrl: null,
      note: item.comment || null,
    };

    estimateItems.push(estimateItem);
  }

  return estimateItems;
}

/**
 * コーティング診断結果から見積項目を追加（既存項目と重複チェック）
 *
 * @param existingItems 既存の見積項目リスト
 * @param bodyConditions 車体状態確認結果リスト
 * @returns 追加された見積項目リスト
 */
export function addCoatingDiagnosisItemsToEstimate(
  existingItems: EstimateItem[],
  bodyConditions: BodyConditionCheck[]
): EstimateItem[] {
  const newItems = convertCoatingDiagnosisToEstimateItems(bodyConditions);
  const existingNames = new Set(existingItems.map((item) => item.name));

  // 重複を除外して追加
  const itemsToAdd = newItems.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...existingItems, ...itemsToAdd];
}










