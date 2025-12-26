/**
 * 12ヶ月点検・24ヶ月点検テンプレートPDF生成機能
 * 
 * PDFテンプレートを読み込み、入力内容を反映して出力します。
 * レテン（✓）を使用して点検結果を記入します。
 */

import { ApiResponse } from "@/types";
import { InspectionItem } from "./inspection-items";
import { InspectionRecordData } from "./inspection-pdf-generator";

// =============================================================================
// 型定義
// =============================================================================

/**
 * テンプレート種別
 */
export type InspectionTemplateType = "12month" | "24month";

/**
 * 項目マッピング設定（テンプレートPDF上の座標と項目IDの対応）
 * 
 * 注意: 実際のPDFテンプレートの座標は、PDFを解析して正確な値を設定する必要があります。
 * この型定義は、後で調整可能な構造を提供します。
 */
interface ItemPosition {
  /** X座標（mm） */
  x: number;
  /** Y座標（mm） */
  y: number;
  /** チェックボックスのサイズ（mm） */
  size?: number;
}

/**
 * 項目位置マッピング（項目ID → 位置）
 */
type ItemPositionMap = Record<string, ItemPosition>;

// =============================================================================
// テンプレート設定
// =============================================================================

/**
 * 12ヶ月点検テンプレートの項目位置マッピング
 * 
 * 注意: 実際のPDFテンプレートの座標を確認して調整してください。
 */
const TEMPLATE_12MONTH_POSITIONS: ItemPositionMap = {
  // エンジン・ルーム点検
  "engine-room-001": { x: 30, y: 60 }, // パワー・ステアリング
  "engine-room-002": { x: 30, y: 65 }, // 冷却装置
  "engine-room-003": { x: 30, y: 70 }, // エンジンオイル
  "engine-room-004": { x: 30, y: 75 }, // オイルフィルター
  "engine-room-005": { x: 30, y: 80 }, // エンジンベルト
  "engine-room-006": { x: 30, y: 85 }, // バッテリー
  "engine-room-007": { x: 30, y: 90 }, // エアクリーナー
  "engine-room-008": { x: 30, y: 95 }, // 燃料装置
  "engine-room-009": { x: 30, y: 100 }, // 点火プラグ
  "engine-room-010": { x: 30, y: 105 }, // 点火コイル
  "engine-room-011": { x: 30, y: 110 }, // エンジン本体
  "engine-room-012": { x: 30, y: 115 }, // 排気装置
  "engine-room-013": { x: 30, y: 120 }, // オイル漏れ
  "engine-room-014": { x: 30, y: 125 }, // 冷却水漏れ
  "engine-room-015": { x: 30, y: 130 }, // 燃料漏れ

  // 室内点検
  "interior-001": { x: 100, y: 60 }, // シートベルト
  "interior-002": { x: 100, y: 65 }, // エアバッグ
  "interior-003": { x: 100, y: 70 }, // ワイパー
  "interior-004": { x: 100, y: 75 }, // ワイシャー液
  "interior-005": { x: 100, y: 80 }, // ハンドル操作
  "interior-006": { x: 100, y: 85 }, // クラッチペダル
  "interior-007": { x: 100, y: 90 }, // ブレーキペダル
  "interior-008": { x: 100, y: 95 }, // パーキングブレーキ

  // 足廻り点検
  "chassis-001": { x: 170, y: 60 }, // タイヤ（前輪）
  "chassis-002": { x: 170, y: 65 }, // タイヤ（後輪）
  "chassis-003": { x: 170, y: 70 }, // ホイール
  "chassis-004": { x: 170, y: 75 }, // ブレーキパッド（前）
  "chassis-005": { x: 170, y: 80 }, // ブレーキパッド（後）
  "chassis-006": { x: 170, y: 85 }, // ブレーキディスク（前）
  "chassis-007": { x: 170, y: 90 }, // ブレーキディスク（後）
  "chassis-008": { x: 170, y: 95 }, // ブレーキホース
  "chassis-009": { x: 170, y: 100 }, // サスペンション（前）
  "chassis-010": { x: 170, y: 105 }, // サスペンション（後）

  // 下廻り点検
  "underbody-001": { x: 30, y: 140 }, // 排気系統
  "underbody-002": { x: 30, y: 145 }, // フレーム
  "underbody-003": { x: 30, y: 150 }, // ドライブシャフト
  "underbody-004": { x: 30, y: 155 }, // ギアボックス
  "underbody-005": { x: 30, y: 160 }, // オイル漏れ（下廻り）

  // 外廻り点検
  "exterior-001": { x: 100, y: 140 }, // ライト（前）
  "exterior-002": { x: 100, y: 145 }, // ライト（後）
  "exterior-003": { x: 100, y: 150 }, // ワイパーゴム
  "exterior-004": { x: 100, y: 155 }, // ウィンドウ
  "exterior-005": { x: 100, y: 160 }, // ボディー

  // 日常点検
  "daily-001": { x: 170, y: 140 }, // 燃料
  "daily-002": { x: 170, y: 145 }, // エンジンオイル
  "daily-003": { x: 170, y: 150 }, // 冷却水
  "daily-004": { x: 170, y: 155 }, // バッテリー
  "daily-005": { x: 170, y: 160 }, // タイヤ空気圧
};

/**
 * 24ヶ月点検テンプレートの項目位置マッピング
 * 
 * 注意: 実際のPDFテンプレートの座標を確認して調整してください。
 * 24ヶ月点検は12ヶ月点検の項目に加えて、より詳細な項目が含まれます。
 */
const TEMPLATE_24MONTH_POSITIONS: ItemPositionMap = {
  ...TEMPLATE_12MONTH_POSITIONS, // 12ヶ月点検の項目を含む
  // 24ヶ月点検で追加される項目の位置をここに追加
  // 例: "additional-item-001": { x: 30, y: 180 },
};

/**
 * テキストフィールドの位置（車両情報など）
 */
interface TextFieldPosition {
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
}

interface TemplateTextFields {
  /** 依頼者(使用者) */
  ownerName: TextFieldPosition;
  /** 車名及び型式 */
  vehicleName: TextFieldPosition;
  /** 自動車登録番号又は車両番号 */
  licensePlate: TextFieldPosition;
  /** 原動機の型式 */
  engineType?: TextFieldPosition;
  /** 初度登録年又は初度検査年 */
  firstRegistrationYear?: TextFieldPosition;
  /** 車台番号 */
  chassisNumber?: TextFieldPosition;
  /** 整備主任者 */
  mechanicName: TextFieldPosition;
  /** 点検(整備)時の総走行距離 */
  mileage: TextFieldPosition;
  /** 点検日 */
  inspectionDate: TextFieldPosition;
}

/**
 * 12ヶ月点検テンプレートのテキストフィールド位置
 */
const TEMPLATE_12MONTH_TEXT_FIELDS: TemplateTextFields = {
  ownerName: { x: 60, y: 40, width: 100, fontSize: 10 },
  vehicleName: { x: 60, y: 45, width: 100, fontSize: 10 },
  licensePlate: { x: 60, y: 50, width: 80, fontSize: 10 },
  engineType: { x: 170, y: 40, width: 80, fontSize: 10 },
  firstRegistrationYear: { x: 170, y: 45, width: 60, fontSize: 10 },
  chassisNumber: { x: 170, y: 50, width: 100, fontSize: 10 },
  mechanicName: { x: 60, y: 200, width: 80, fontSize: 10 },
  mileage: { x: 150, y: 200, width: 80, fontSize: 10 },
  inspectionDate: { x: 60, y: 205, width: 80, fontSize: 10 },
};

/**
 * 24ヶ月点検テンプレートのテキストフィールド位置
 */
const TEMPLATE_24MONTH_TEXT_FIELDS: TemplateTextFields = {
  ...TEMPLATE_12MONTH_TEXT_FIELDS,
  // 24ヶ月点検で異なる位置がある場合は上書き
};

// =============================================================================
// PDF生成
// =============================================================================

/**
 * チェックマーク（レテン）を描画
 * 
 * @param page PDFページ
 * @param x X座標（ポイント、左下が原点）
 * @param y Y座標（ポイント、左下が原点）
 * @param size サイズ（ポイント）
 * @param font フォント（日本語フォントがある場合は使用）
 */
function drawCheckmark(
  page: any,
  x: number,
  y: number,
  size: number = 10,
  font?: any
): void {
  try {
    // 方法1: テキストとして✓文字を描画（日本語フォントがある場合）
    if (font) {
      page.drawText("✓", {
        x: x,
        y: y,
        size: size,
        font: font,
      });
      return;
    }

    // 方法2: 線を描画してチェックマークを作成（日本語フォントがない場合）
    // チェックマークを2本の線で描画
    const lineWidth = size / 6;
    const checkSize = size * 0.6;

    // 下から左への線
    page.drawLine({
      start: { x: x, y: y },
      end: { x: x + checkSize * 0.35, y: y + checkSize * 0.35 },
      thickness: lineWidth,
      color: { r: 0, g: 0, b: 0 },
    });

    // 左から上への線
    page.drawLine({
      start: { x: x + checkSize * 0.35, y: y + checkSize * 0.35 },
      end: { x: x + checkSize, y: y - checkSize * 0.2 },
      thickness: lineWidth,
      color: { r: 0, g: 0, b: 0 },
    });
  } catch (error) {
    console.warn("[PDF] チェックマークの描画に失敗:", error);
    // フォールバック: 矩形で簡易的にチェックボックスを描画
    try {
      page.drawRectangle({
        x: x,
        y: y,
        width: size * 0.8,
        height: size * 0.8,
        borderWidth: 1,
        borderColor: { r: 0, g: 0, b: 0 },
      });
    } catch (rectError) {
      console.error("[PDF] チェックボックスの描画にも失敗:", rectError);
    }
  }
}

/**
 * 12ヶ月点検または24ヶ月点検のテンプレートPDFを生成
 * 
 * @param data 分解整備記録簿データ
 * @param templateType テンプレート種別
 * @returns PDF Blob
 */
export async function generateInspectionTemplatePDF(
  data: InspectionRecordData,
  templateType: InspectionTemplateType = "12month"
): Promise<ApiResponse<Blob>> {
  try {
    // pdf-libを動的インポート（クライアント側でのみ使用）
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

    // テンプレートPDFのパスを決定
    const templatePath = templateType === "12month"
      ? "/12カ月点検テンプレート.pdf"
      : "/24か月点検用テンプレート.pdf";

    // テンプレートPDFを読み込む
    const templateResponse = await fetch(templatePath);
    if (!templateResponse.ok) {
      throw new Error(`テンプレートPDFの読み込みに失敗しました: ${templatePath}`);
    }

    const templateBytes = await templateResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);

    // フォントを取得
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 日本語フォントの読み込みを試みる（利用可能な場合）
    let japaneseFont: any = null;
    try {
      // NotoSansJPフォントを読み込む（publicフォルダから）
      const fontResponse = await fetch("/fonts/NotoSansJP-Regular.ttf");
      if (fontResponse.ok) {
        const fontBytes = await fontResponse.arrayBuffer();
        japaneseFont = await pdfDoc.embedFont(fontBytes);
      }
    } catch (error) {
      console.warn("[PDF] 日本語フォントの読み込みに失敗、Helveticaを使用:", error);
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // 使用する位置マッピングとテキストフィールド設定を決定
    const itemPositions = templateType === "12month"
      ? TEMPLATE_12MONTH_POSITIONS
      : TEMPLATE_24MONTH_POSITIONS;
    const textFields = templateType === "12month"
      ? TEMPLATE_12MONTH_TEXT_FIELDS
      : TEMPLATE_24MONTH_TEXT_FIELDS;

    const fontToUse = japaneseFont || helveticaFont;
    const fontBoldToUse = japaneseFont || helveticaBoldFont;

    // =============================================================================
    // テキストフィールドにデータを書き込む
    // =============================================================================

    // mmからptへの変換係数（1mm = 2.83465pt）
    const mmToPt = 2.83465;

    // 依頼者(使用者)
    firstPage.drawText(data.vehicle.ownerName || "", {
      x: textFields.ownerName.x * mmToPt,
      y: pageHeight - (textFields.ownerName.y * mmToPt),
      size: textFields.ownerName.fontSize || 10,
      font: fontToUse,
    });

    // 車名及び型式
    firstPage.drawText(data.vehicle.vehicleName || "", {
      x: textFields.vehicleName.x * mmToPt,
      y: pageHeight - (textFields.vehicleName.y * mmToPt),
      size: textFields.vehicleName.fontSize || 10,
      font: fontToUse,
    });

    // 自動車登録番号又は車両番号
    firstPage.drawText(data.vehicle.licensePlate || "", {
      x: textFields.licensePlate.x * mmToPt,
      y: pageHeight - (textFields.licensePlate.y * mmToPt),
      size: textFields.licensePlate.fontSize || 10,
      font: fontToUse,
    });

    // 原動機の型式（ある場合）
    if (data.vehicle.engineType && textFields.engineType) {
      firstPage.drawText(data.vehicle.engineType, {
        x: textFields.engineType.x * mmToPt,
        y: pageHeight - (textFields.engineType.y * mmToPt),
        size: textFields.engineType.fontSize || 10,
        font: fontToUse,
      });
    }

    // 初度登録年又は初度検査年（ある場合）
    if (data.vehicle.firstRegistrationYear && textFields.firstRegistrationYear) {
      firstPage.drawText(data.vehicle.firstRegistrationYear, {
        x: textFields.firstRegistrationYear.x * mmToPt,
        y: pageHeight - (textFields.firstRegistrationYear.y * mmToPt),
        size: textFields.firstRegistrationYear.fontSize || 10,
        font: fontToUse,
      });
    }

    // 車台番号（ある場合）
    if (data.vehicle.chassisNumber && textFields.chassisNumber) {
      firstPage.drawText(data.vehicle.chassisNumber, {
        x: textFields.chassisNumber.x * mmToPt,
        y: pageHeight - (textFields.chassisNumber.y * mmToPt),
        size: textFields.chassisNumber.fontSize || 10,
        font: fontToUse,
      });
    }

    // 整備主任者
    firstPage.drawText(data.mechanicName || "", {
      x: textFields.mechanicName.x * mmToPt,
      y: pageHeight - (textFields.mechanicName.y * mmToPt),
      size: textFields.mechanicName.fontSize || 10,
      font: fontToUse,
    });

    // 点検(整備)時の総走行距離
    firstPage.drawText(`${data.mileage.toLocaleString()} km`, {
      x: textFields.mileage.x * mmToPt,
      y: pageHeight - (textFields.mileage.y * mmToPt),
      size: textFields.mileage.fontSize || 10,
      font: fontToUse,
    });

    // 点検日
    const inspectionDate = new Date(data.inspectionDate);
    const dateStr = inspectionDate.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    firstPage.drawText(dateStr, {
      x: textFields.inspectionDate.x * mmToPt,
      y: pageHeight - (textFields.inspectionDate.y * mmToPt),
      size: textFields.inspectionDate.fontSize || 10,
      font: fontToUse,
    });

    // =============================================================================
    // 検査項目にチェックマーク（レテン）を書き込む
    // =============================================================================

    for (const item of data.inspectionItems) {
      const position = itemPositions[item.id];
      if (!position) {
        // 項目の位置がマッピングされていない場合はスキップ
        console.warn(`[PDF] 項目 "${item.id}" の位置がマッピングされていません`);
        continue;
      }

      // mm座標をpt座標に変換
      const xPt = position.x * mmToPt;
      const yPt = pageHeight - (position.y * mmToPt); // pdf-libは左下が原点

      // 状態に応じてチェックマークを描画
      // OK（green）、調整（adjust）、清掃（clean）の場合はレテンを描画
      if (item.status === "green" || item.status === "adjust" || item.status === "clean") {
        const checkSize = (position.size || 3) * mmToPt;
        drawCheckmark(
          firstPage,
          xPt,
          yPt,
          checkSize,
          japaneseFont
        );
      }

      // 測定値がある場合は、位置の近くにテキストで表示
      if (item.measurementValue !== undefined && item.measurement) {
        const measurementText = `${item.measurementValue}${item.measurement.unit}`;
        firstPage.drawText(measurementText, {
          x: xPt + (10 * mmToPt),
          y: yPt,
          size: 8,
          font: fontToUse,
        });
      }

      // コメントがある場合は、位置の近くにテキストで表示
      if (item.comment) {
        // pdf-libではmaxWidthはwidthパラメータとして指定
        firstPage.drawText(item.comment, {
          x: xPt + (20 * mmToPt),
          y: yPt,
          size: 8,
          font: fontToUse,
          maxWidth: 100 * mmToPt,
        });
      }
    }

    // =============================================================================
    // 交換部品を書き込む（別ページまたは指定位置に）
    // =============================================================================
    if (data.replacementParts && data.replacementParts.length > 0) {
      // 2ページ目を作成するか、1ページ目の指定位置に書き込む
      // ここでは1ページ目の下部に書き込む例
      let partsY = pageHeight - (250 * mmToPt); // 下部から250mmの位置

      for (const part of data.replacementParts) {
        const partText = `${part.name}: ${part.quantity}${part.unit}`;
        firstPage.drawText(partText, {
          x: 30 * mmToPt,
          y: partsY,
          size: 9,
          font: fontToUse,
        });
        partsY -= (10 * mmToPt); // 次の行へ
      }
    }

    // =============================================================================
    // PDFをBlobに変換
    // =============================================================================
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });

    return {
      success: true,
      data: pdfBlob,
    };
  } catch (error) {
    console.error("[PDF Template] 生成エラー:", error);
    return {
      success: false,
      error: {
        code: "PDF_TEMPLATE_GENERATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "PDFテンプレートの生成に失敗しました",
      },
    };
  }
}

