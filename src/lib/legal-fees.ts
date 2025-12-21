/**
 * 法定費用管理機能
 *
 * 車検時の法定費用をGoogle Sheetsから自動取得
 */

import { ApiResponse } from "@/types";
import { findVehicleMasterById } from "./google-sheets";

// =============================================================================
// 型定義
// =============================================================================

/**
 * 法定費用項目
 */
export interface LegalFeeItem {
  /** 項目名 */
  name: string;
  /** 金額（税込） */
  amount: number;
  /** 説明 */
  description?: string;
  /** 必須かどうか */
  required: boolean;
}

/**
 * 法定費用データ
 */
export interface LegalFees {
  /** 車検（24ヶ月） */
  inspection: number;
  /** 自動車重量税 */
  weightTax: number;
  /** 自賠責保険料 */
  liabilityInsurance: number;
  /** 印紙代 */
  stampDuty: number;
  /** 代行手数料（該当する場合） */
  proxyFee?: number;
  /** テスター代（該当する場合） */
  testerFee?: number;
  /** 合計金額 */
  total: number;
}

// =============================================================================
// 法定費用取得
// =============================================================================

/**
 * 車両IDから法定費用を取得
 *
 * @param vehicleId 車両ID（Google Sheetsの車両マスタのID）
 * @returns 法定費用データ
 */
export async function getLegalFees(
  vehicleId: string
): Promise<ApiResponse<LegalFees>> {
  try {
    // Google Sheets APIから車両マスタを取得
    const vehicle = await findVehicleMasterById(vehicleId);
    if (!vehicle) {
      return {
        success: false,
        error: {
          code: "VEHICLE_NOT_FOUND",
          message: "車両が見つかりません",
        },
      };
    }

    // 法定費用を計算
    // 注意: 実際の法定費用は車両の重量、排気量、年式などに基づいて計算されますが、
    // 現在の車両マスタにはそのような情報が含まれていないため、
    // デフォルト値を使用します（将来的には車両マスタに重量・排気量情報を追加することを推奨）
    const legalFees: LegalFees = {
      inspection: 66000, // 車検（24ヶ月）- 固定費用
      weightTax: 24600, // 自動車重量税 - 車両重量に応じて変動（0.5t未満: 8,200円、0.5t以上1t未満: 16,400円、1t以上1.5t未満: 24,600円、1.5t以上2t未満: 32,800円、2t以上2.5t未満: 41,000円、2.5t以上: 49,200円）
      liabilityInsurance: 17650, // 自賠責保険料 - 排気量・年式に応じて変動（軽自動車: 26,370円、普通車: 17,650円など）
      stampDuty: 2300, // 印紙代 - 固定費用
      proxyFee: 19800, // 代行手数料（該当する場合）- オプション
      testerFee: 4400, // テスター代（該当する場合）- オプション
      total: 0, // 合計は後で計算
    };

    // 合計を計算
    legalFees.total =
      legalFees.inspection +
      legalFees.weightTax +
      legalFees.liabilityInsurance +
      legalFees.stampDuty +
      (legalFees.proxyFee || 0) +
      (legalFees.testerFee || 0);

    return {
      success: true,
      data: legalFees,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "法定費用の取得に失敗しました",
      },
    };
  }
}

/**
 * 法定費用を項目リスト形式に変換
 */
export function convertLegalFeesToItems(
  legalFees: LegalFees
): LegalFeeItem[] {
  const items: LegalFeeItem[] = [
    {
      name: "車検（24ヶ月）",
      amount: legalFees.inspection,
      description: "24ヶ月点検費用",
      required: true,
    },
    {
      name: "自動車重量税",
      amount: legalFees.weightTax,
      description: "車両重量に応じた税金",
      required: true,
    },
    {
      name: "自賠責保険料",
      amount: legalFees.liabilityInsurance,
      description: "自動車損害賠償責任保険",
      required: true,
    },
    {
      name: "印紙代",
      amount: legalFees.stampDuty,
      description: "車検証交付手数料",
      required: true,
    },
  ];

  // 代行手数料（該当する場合）
  if (legalFees.proxyFee) {
    items.push({
      name: "代行手数料",
      amount: legalFees.proxyFee,
      description: "代行手続き費用",
      required: false,
    });
  }

  // テスター代（該当する場合）
  if (legalFees.testerFee) {
    items.push({
      name: "テスター代",
      amount: legalFees.testerFee,
      description: "検査機器使用料",
      required: false,
    });
  }

  return items;
}










