/**
 * 部品情報管理のユーティリティ
 * 改善提案 #3: 部品調達待ち案件の管理機能
 */

import { PartsInfo, PartItem } from "@/types";

/**
 * field26から部品情報をパース
 * field26はJSON形式で、jobMemosとpartsInfoの両方が含まれる可能性がある
 */
export function parsePartsInfoFromField26(field26: string | null | undefined): PartsInfo | null {
  if (!field26) return null;

  try {
    const parsed = JSON.parse(field26);
    
    // partsInfoが直接含まれている場合
    if (parsed.partsInfo) {
      return parsed.partsInfo as PartsInfo;
    }
    
    // partsInfoがルートレベルにある場合（後方互換性）
    if (parsed.parts && Array.isArray(parsed.parts)) {
      return {
        parts: parsed.parts,
        expectedArrivalDate: parsed.expectedArrivalDate || null,
        procurementStatus: parsed.procurementStatus || "not_ordered",
        lastUpdatedAt: parsed.lastUpdatedAt || new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse partsInfo from field26:", error);
    return null;
  }
}

/**
 * field26に部品情報を保存
 * jobMemosとpartsInfoの両方を保持する
 */
export function savePartsInfoToField26(
  currentField26: string | null | undefined,
  partsInfo: PartsInfo
): string {
  let parsed: any = {};
  
  // 既存のfield26をパース
  if (currentField26) {
    try {
      parsed = JSON.parse(currentField26);
    } catch (error) {
      console.error("Failed to parse existing field26:", error);
      parsed = {};
    }
  }
  
  // partsInfoを更新
  parsed.partsInfo = {
    ...partsInfo,
    lastUpdatedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(parsed);
}

/**
 * 部品情報を初期化
 */
export function createInitialPartsInfo(): PartsInfo {
  return {
    parts: [],
    expectedArrivalDate: null,
    procurementStatus: "not_ordered",
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * 部品項目を初期化
 */
export function createInitialPartItem(): PartItem {
  return {
    id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    partNumber: null,
    quantity: 1,
    unitPrice: null,
    supplier: null,
    orderDate: null,
    expectedArrivalDate: null,
    actualArrivalDate: null,
    status: "not_ordered",
    storageLocation: null,
  };
}

/**
 * すべての部品が到着済みかどうかを判定
 */
export function areAllPartsArrived(partsInfo: PartsInfo | null): boolean {
  if (!partsInfo || partsInfo.parts.length === 0) return false;
  
  return partsInfo.parts.every((part) => part.status === "arrived");
}

/**
 * 部品の調達状況を更新
 */
export function updatePartStatus(
  partsInfo: PartsInfo,
  partId: string,
  status: PartItem["status"]
): PartsInfo {
  const updatedParts = partsInfo.parts.map((part) => {
    if (part.id === partId) {
      const updatedPart = { ...part, status };
      
      // 到着済みの場合、実際の到着日を記録
      if (status === "arrived" && !updatedPart.actualArrivalDate) {
        updatedPart.actualArrivalDate = new Date().toISOString();
      }
      
      return updatedPart;
    }
    return part;
  });
  
  // 全体の調達状況を更新
  const allArrived = updatedParts.every((p) => p.status === "arrived");
  const allOrdered = updatedParts.every((p) => p.status !== "not_ordered");
  const hasShipping = updatedParts.some((p) => p.status === "shipping");
  
  let procurementStatus: PartsInfo["procurementStatus"] = "not_ordered";
  if (allArrived) {
    procurementStatus = "arrived";
  } else if (hasShipping) {
    procurementStatus = "shipping";
  } else if (allOrdered) {
    procurementStatus = "ordered";
  }
  
  return {
    ...partsInfo,
    parts: updatedParts,
    procurementStatus,
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * 部品調達期間を計算（日数）
 * 最初の発注日から現在までの経過日数を計算
 */
export function getPartsProcurementDays(partsInfo: PartsInfo | null): number {
  if (!partsInfo || partsInfo.parts.length === 0) return 0;
  
  // 発注済みの部品の中で最も古い発注日を取得
  const orderedParts = partsInfo.parts.filter((p) => p.orderDate);
  if (orderedParts.length === 0) return 0;
  
  const oldestOrderDate = orderedParts.reduce((oldest, part) => {
    if (!part.orderDate) return oldest;
    const partDate = new Date(part.orderDate);
    return !oldest || partDate < oldest ? partDate : oldest;
  }, null as Date | null);
  
  if (!oldestOrderDate) return 0;
  
  const now = new Date();
  const diffTime = now.getTime() - oldestOrderDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * 部品調達が長期化しているかどうかを判定
 * @param partsInfo 部品情報
 * @param thresholdDays 閾値（デフォルト: 設定値から取得、設定値がない場合は7日）
 */
export function isLongPartsProcurement(
  partsInfo: PartsInfo | null,
  thresholdDays?: number
): boolean {
  if (!partsInfo || partsInfo.parts.length === 0) return false;
  
  // すべての部品が到着済みの場合は長期化していない
  if (areAllPartsArrived(partsInfo)) return false;
  
  // 閾値が指定されていない場合は設定値から取得
  if (thresholdDays === undefined) {
    try {
      const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
      const config = getNumericalMasterConfig();
      thresholdDays = config.thresholds.longPartsProcurementDays;
    } catch {
      thresholdDays = 7; // フォールバック
    }
  }
  
  const procurementDays = getPartsProcurementDays(partsInfo);
  return procurementDays >= (thresholdDays || 0);
}

/**
 * 部品の到着予定日が過ぎているかどうかを判定
 * @param partsInfo 部品情報
 */
export function hasOverdueParts(partsInfo: PartsInfo | null): boolean {
  if (!partsInfo || partsInfo.parts.length === 0) return false;
  
  const now = new Date();
  
  // 未到着の部品で、到着予定日が過ぎているものがあるかチェック
  return partsInfo.parts.some((part) => {
    if (part.status === "arrived") return false; // 到着済みは除外
    if (!part.expectedArrivalDate) return false; // 到着予定日がない場合は除外
    
    const expectedDate = new Date(part.expectedArrivalDate);
    return expectedDate < now;
  });
}

/**
 * 部品の到着予定日が近づいているかどうかを判定（3日以内）
 * @param partsInfo 部品情報
 */
export function hasUpcomingPartsArrival(partsInfo: PartsInfo | null): boolean {
  if (!partsInfo || partsInfo.parts.length === 0) return false;
  
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  // 未到着の部品で、到着予定日が3日以内のものがあるかチェック
  return partsInfo.parts.some((part) => {
    if (part.status === "arrived") return false; // 到着済みは除外
    if (!part.expectedArrivalDate) return false; // 到着予定日がない場合は除外
    
    const expectedDate = new Date(part.expectedArrivalDate);
    return expectedDate >= now && expectedDate <= threeDaysLater;
  });
}

