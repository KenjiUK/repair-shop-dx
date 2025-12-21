/**
 * 分解整備記録簿PDF生成機能
 *
 * 車検・12ヵ月点検の分解整備記録簿をPDF形式で生成
 */

import { ApiResponse } from "@/types";
import { InspectionItem } from "./inspection-items";

// =============================================================================
// 型定義
// =============================================================================

/**
 * 車両情報
 */
export interface VehicleInfo {
  /** 依頼者(使用者)の氏名又は名称 */
  ownerName: string;
  /** 車名及び型式 */
  vehicleName: string;
  /** 自動車登録番号又は車両番号 */
  licensePlate: string;
  /** 原動機の型式 */
  engineType?: string;
  /** 初度登録年又は初度検査年 */
  firstRegistrationYear?: string;
  /** 車台番号 */
  chassisNumber?: string;
}

/**
 * 交換部品情報
 */
export interface ReplacementPart {
  /** 部品名 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 単位 */
  unit: string;
}

/**
 * 分解整備記録簿データ
 */
export interface InspectionRecordData {
  /** 車両情報 */
  vehicle: VehicleInfo;
  /** 検査項目リスト */
  inspectionItems: InspectionItem[];
  /** 交換部品リスト */
  replacementParts?: ReplacementPart[];
  /** 整備主任者の氏名 */
  mechanicName: string;
  /** 点検(整備)時の総走行距離 */
  mileage: number;
  /** 点検日 */
  inspectionDate: string; // ISO 8601
}

// =============================================================================
// PDF生成
// =============================================================================

/**
 * 分解整備記録簿PDFを生成
 *
 * @param data 分解整備記録簿データ
 * @returns PDF Blob
 */
export async function generateInspectionRecordPDF(
  data: InspectionRecordData
): Promise<ApiResponse<Blob>> {
  try {
    // 動的インポート（クライアント側でのみ使用）
    const { jsPDF } = await import("jspdf");

    // PDFドキュメントを作成（A4サイズ）
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // フォントサイズ設定
    const fontSize = {
      title: 16,
      heading: 12,
      normal: 10,
      small: 8,
    };

    // マージン設定
    const margin = {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
    };

    let yPosition = margin.top;

    // =============================================================================
    // タイトル
    // =============================================================================
    doc.setFontSize(fontSize.title);
    doc.setFont("helvetica", "bold");
    doc.text("分解整備記録簿", 105, yPosition, { align: "center" });
    yPosition += 10;

    // =============================================================================
    // 車両情報
    // =============================================================================
    doc.setFontSize(fontSize.heading);
    doc.setFont("helvetica", "bold");
    doc.text("車両情報", margin.left, yPosition);
    yPosition += 7;

    doc.setFontSize(fontSize.normal);
    doc.setFont("helvetica", "normal");
    doc.text(`依頼者(使用者): ${data.vehicle.ownerName}`, margin.left, yPosition);
    yPosition += 6;
    doc.text(`車名及び型式: ${data.vehicle.vehicleName}`, margin.left, yPosition);
    yPosition += 6;
    doc.text(
      `自動車登録番号又は車両番号: ${data.vehicle.licensePlate}`,
      margin.left,
      yPosition
    );
    yPosition += 6;

    if (data.vehicle.engineType) {
      doc.text(`原動機の型式: ${data.vehicle.engineType}`, margin.left, yPosition);
      yPosition += 6;
    }
    if (data.vehicle.firstRegistrationYear) {
      doc.text(
        `初度登録年又は初度検査年: ${data.vehicle.firstRegistrationYear}`,
        margin.left,
        yPosition
      );
      yPosition += 6;
    }
    if (data.vehicle.chassisNumber) {
      doc.text(`車台番号: ${data.vehicle.chassisNumber}`, margin.left, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // =============================================================================
    // 検査項目
    // =============================================================================
    doc.setFontSize(fontSize.heading);
    doc.setFont("helvetica", "bold");
    doc.text("検査項目", margin.left, yPosition);
    yPosition += 7;

    // カテゴリごとにグループ化
    const itemsByCategory = data.inspectionItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, InspectionItem[]>
    );

    // カテゴリごとに表示
    for (const [category, items] of Object.entries(itemsByCategory)) {
      // カテゴリ名
      doc.setFontSize(fontSize.normal);
      doc.setFont("helvetica", "bold");
      doc.text(
        getCategoryDisplayName(category),
        margin.left,
        yPosition
      );
      yPosition += 6;

      // 検査項目リスト
      doc.setFontSize(fontSize.small);
      doc.setFont("helvetica", "normal");

      for (const item of items) {
        // ページ改行チェック
        if (yPosition > 250) {
          doc.addPage();
          yPosition = margin.top;
        }

        const statusText = getStatusText(item.status);
        const measurementText = item.measurementValue
          ? ` (測定値: ${item.measurementValue}${item.measurement?.unit || ""})`
          : "";

        doc.text(
          `・${item.name}: ${statusText}${measurementText}`,
          margin.left + 5,
          yPosition
        );
        yPosition += 5;

        if (item.comment) {
          doc.text(`  ${item.comment}`, margin.left + 10, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 3;
    }

    // =============================================================================
    // 交換部品
    // =============================================================================
    if (data.replacementParts && data.replacementParts.length > 0) {
      // ページ改行チェック
      if (yPosition > 240) {
        doc.addPage();
        yPosition = margin.top;
      }

      doc.setFontSize(fontSize.heading);
      doc.setFont("helvetica", "bold");
      doc.text("交換部品", margin.left, yPosition);
      yPosition += 7;

      doc.setFontSize(fontSize.normal);
      doc.setFont("helvetica", "normal");

      for (const part of data.replacementParts) {
        doc.text(
          `・${part.name}: ${part.quantity}${part.unit}`,
          margin.left + 5,
          yPosition
        );
        yPosition += 6;
      }

      yPosition += 5;
    }

    // =============================================================================
    // 整備情報
    // =============================================================================
    // ページ改行チェック
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin.top;
    }

    doc.setFontSize(fontSize.heading);
    doc.setFont("helvetica", "bold");
    doc.text("整備情報", margin.left, yPosition);
    yPosition += 7;

    doc.setFontSize(fontSize.normal);
    doc.setFont("helvetica", "normal");
    doc.text(
      `整備主任者: ${data.mechanicName}`,
      margin.left,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `点検(整備)時の総走行距離: ${data.mileage.toLocaleString()} km`,
      margin.left,
      yPosition
    );
    yPosition += 6;

    const inspectionDate = new Date(data.inspectionDate);
    doc.text(
      `点検日: ${inspectionDate.toLocaleDateString("ja-JP")}`,
      margin.left,
      yPosition
    );

    // =============================================================================
    // PDFをBlobに変換
    // =============================================================================
    const pdfBlob = doc.output("blob");

    return {
      success: true,
      data: pdfBlob,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "PDF_GENERATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "PDFの生成に失敗しました",
      },
    };
  }
}

/**
 * カテゴリの表示名を取得
 */
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    engine_room: "エンジン・ルーム点検",
    interior: "室内点検",
    chassis: "足廻り点検",
    underbody: "下廻り点検",
    exterior: "外廻り点検",
    daily: "日常点検",
    other: "その他",
  };
  return categoryNames[category] || category;
}

/**
 * 状態の表示テキストを取得
 */
function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    green: "OK",
    yellow: "注意",
    red: "要交換",
    adjust: "調整",
    clean: "清掃",
    skip: "省略",
    not_applicable: "該当なし",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}















