/**
 * 分解整備記録簿PDF生成機能
 *
 * 車検・12ヵ月点検の分解整備記録簿をPDF形式で生成
 */

import { ApiResponse } from "@/types";
import { InspectionItem } from "./inspection-items";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadCustomFont, drawText as drawTextHelper, splitTextToSize, drawLine } from "./pdf-utils";

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
  /** 点検(整備)時の総走行距離（顧客申告があればその値、無ければnull） */
  mileage: number | null;
  /** 点検日 */
  inspectionDate: string; // ISO 8601
  /** 24ヶ月点検リデザイン版の測定値データ */
  measurements?: {
    /** CO濃度（%） */
    coConcentration?: number;
    /** HC濃度（ppm） */
    hcConcentration?: number;
    /** ブレーキパッド前左（mm） */
    brakePadFrontLeft?: number;
    /** ブレーキパッド前右（mm） */
    brakePadFrontRight?: number;
    /** ブレーキパッド後左（mm） */
    brakePadRearLeft?: number;
    /** ブレーキパッド後右（mm） */
    brakePadRearRight?: number;
    /** タイヤ溝前左（mm） */
    tireDepthFrontLeft?: number;
    /** タイヤ溝前右（mm） */
    tireDepthFrontRight?: number;
    /** タイヤ溝後左（mm） */
    tireDepthRearLeft?: number;
    /** タイヤ溝後右（mm） */
    tireDepthRearRight?: number;
  };
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
    // PDFドキュメントを作成
    const doc = await PDFDocument.create();

    // フォント読み込み
    const regularFontUrl = "/fonts/NotoSansJP-Regular.ttf";
    const boldFontUrl = "/fonts/NotoSansJP-Bold.ttf";

    let regularFont = await loadCustomFont(doc, regularFontUrl, "NotoSansJP-Regular");
    let boldFont = await loadCustomFont(doc, boldFontUrl, "NotoSansJP-Bold");

    // フォールバックフォント
    const fallbackFont = await doc.embedFont(StandardFonts.Helvetica);
    const fallbackBoldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    if (!regularFont) {
      console.warn("[PDF] 日本語Regularフォントの読み込みに失敗しました。StandardFontsを使用します。");
      regularFont = fallbackFont;
    }
    if (!boldFont) {
      console.warn("[PDF] 日本語Boldフォントの読み込みに失敗しました。RegularフォントまたはStandardFontsを使用します。");
      boldFont = regularFont || fallbackBoldFont;
    }

    // A4サイズ設定 (210mm x 297mm) -> points are handled by pdf-lib default if not specified, 
    // but we want A4. pdf-lib defaults to something, let's be explicit.
    // [595.28, 841.89] is standard A4 in points.
    let page = doc.addPage([595.28, 841.89]);

    const fontSize = {
      title: 16,
      heading: 12,
      normal: 10,
      small: 8,
    };

    const margin = {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
    };

    let yPosition = margin.top;

    // Helper to add page if needed
    const checkPageBreak = (heightNeeded: number) => {
      // 297mm is page height. Convert to mm roughly for check.
      // yPosition is in mm.
      if (yPosition + heightNeeded > 277) { // 297 - 20 (bottom margin)
        page = doc.addPage([595.28, 841.89]);
        yPosition = margin.top;
      }
    };

    // =============================================================================
    // タイトル
    // =============================================================================
    drawTextHelper(page, "分解整備記録簿", 105, yPosition, boldFont, fontSize.title, rgb(0, 0, 0), { align: "center" });
    yPosition += 10;

    // =============================================================================
    // 車両情報
    // =============================================================================
    drawTextHelper(page, "車両情報", margin.left, yPosition, boldFont, fontSize.heading);
    yPosition += 7;

    drawTextHelper(page, `依頼者(使用者): ${data.vehicle.ownerName}`, margin.left, yPosition, regularFont, fontSize.normal);
    yPosition += 6;
    drawTextHelper(page, `車名及び型式: ${data.vehicle.vehicleName}`, margin.left, yPosition, regularFont, fontSize.normal);
    yPosition += 6;
    drawTextHelper(page, `自動車登録番号又は車両番号: ${data.vehicle.licensePlate}`, margin.left, yPosition, regularFont, fontSize.normal);
    yPosition += 6;

    if (data.vehicle.engineType) {
      drawTextHelper(page, `原動機の型式: ${data.vehicle.engineType}`, margin.left, yPosition, regularFont, fontSize.normal);
      yPosition += 6;
    }
    if (data.vehicle.firstRegistrationYear) {
      drawTextHelper(page, `初度登録年又は初度検査年: ${data.vehicle.firstRegistrationYear}`, margin.left, yPosition, regularFont, fontSize.normal);
      yPosition += 6;
    }
    if (data.vehicle.chassisNumber) {
      drawTextHelper(page, `車台番号: ${data.vehicle.chassisNumber}`, margin.left, yPosition, regularFont, fontSize.normal);
      yPosition += 6;
    }

    yPosition += 5;

    // =============================================================================
    // 検査項目
    // =============================================================================
    drawTextHelper(page, "検査項目", margin.left, yPosition, boldFont, fontSize.heading);
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
      checkPageBreak(20);
      drawTextHelper(
        page,
        getCategoryDisplayName(category),
        margin.left,
        yPosition,
        boldFont,
        fontSize.normal
      );
      yPosition += 6;

      for (const item of items) {
        checkPageBreak(10);

        const statusText = getStatusText(item.status);
        const measurementText = item.measurementValue
          ? ` (測定値: ${item.measurementValue}${item.measurement?.unit || ""})`
          : "";

        const lineText = `・${item.name}: ${statusText}${measurementText}`;
        drawTextHelper(page, lineText, margin.left + 5, yPosition, regularFont, fontSize.small);
        yPosition += 5;

        if (item.comment) {
          checkPageBreak(5);
          drawTextHelper(page, `  ${item.comment}`, margin.left + 10, yPosition, regularFont, fontSize.small);
          yPosition += 5;
        }
      }

      yPosition += 3;
    }

    // =============================================================================
    // 交換部品
    // =============================================================================
    if (data.replacementParts && data.replacementParts.length > 0) {
      checkPageBreak(20);

      drawTextHelper(page, "交換部品", margin.left, yPosition, boldFont, fontSize.heading);
      yPosition += 7;

      for (const part of data.replacementParts) {
        checkPageBreak(10);
        drawTextHelper(
          page,
          `・${part.name}: ${part.quantity}${part.unit}`,
          margin.left + 5,
          yPosition,
          regularFont,
          fontSize.normal
        );
        yPosition += 6;
      }

      yPosition += 5;
    }

    // =============================================================================
    // 整備情報
    // =============================================================================
    checkPageBreak(30);

    drawTextHelper(page, "整備情報", margin.left, yPosition, boldFont, fontSize.heading);
    yPosition += 7;

    drawTextHelper(page, `整備主任者: ${data.mechanicName}`, margin.left, yPosition, regularFont, fontSize.normal);
    yPosition += 6;

    const mileageText = data.mileage !== null && data.mileage !== undefined
      ? `${data.mileage.toLocaleString()} km`
      : "";
    drawTextHelper(page, `点検(整備)時の総走行距離: ${mileageText}`, margin.left, yPosition, regularFont, fontSize.normal);
    yPosition += 6;

    const inspectionDate = new Date(data.inspectionDate);
    drawTextHelper(
      page,
      `点検日: ${inspectionDate.toLocaleDateString("ja-JP")}`,
      margin.left,
      yPosition,
      regularFont,
      fontSize.normal
    );

    // =============================================================================
    // PDFをBlobに変換
    // =============================================================================
    const pdfBytes = await doc.save();
    const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

    return {
      success: true,
      data: pdfBlob,
    };
  } catch (error) {
    console.error(error);
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
