/**
 * 12ヶ月点検・24ヶ月点検テンプレートPDF生成機能
 * 
 * PDFテンプレートを読み込み、入力内容を反映して出力します。
 * レテン（✓）を使用して点検結果を記入します。
 */

import { ApiResponse } from "@/types";
import { InspectionItem } from "./inspection-items";
import { InspectionRecordData } from "./inspection-pdf-generator";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadCustomFont, mmToPt, drawTextWithAutoSize } from "./pdf-utils";
import { PDF_COORDINATES } from "@/const/pdfCoordinates";

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
  /** 測定値フィールド（24ヶ月点検リデザイン版） */
  measurements?: {
    coConcentration?: TextFieldPosition;
    hcConcentration?: TextFieldPosition;
    brakePadFrontLeft?: TextFieldPosition;
    brakePadFrontRight?: TextFieldPosition;
    brakePadRearLeft?: TextFieldPosition;
    brakePadRearRight?: TextFieldPosition;
    tireDepthFrontLeft?: TextFieldPosition;
    tireDepthFrontRight?: TextFieldPosition;
    tireDepthRearLeft?: TextFieldPosition;
    tireDepthRearRight?: TextFieldPosition;
  };
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
 * 
 * 注意: 実際のPDFテンプレートの座標を確認して調整してください。
 */
const TEMPLATE_24MONTH_TEXT_FIELDS: TemplateTextFields = {
  ...TEMPLATE_12MONTH_TEXT_FIELDS,
  // 24ヶ月点検で異なる位置がある場合は上書き
  // 測定値フィールドの位置（PDFテンプレートに合わせて調整が必要）
  measurements: {
    coConcentration: { x: 170, y: 170, fontSize: 9 },
    hcConcentration: { x: 170, y: 175, fontSize: 9 },
    brakePadFrontLeft: { x: 170, y: 180, fontSize: 9 },
    brakePadFrontRight: { x: 195, y: 180, fontSize: 9 },
    brakePadRearLeft: { x: 170, y: 185, fontSize: 9 },
    brakePadRearRight: { x: 195, y: 185, fontSize: 9 },
    tireDepthFrontLeft: { x: 170, y: 190, fontSize: 9 },
    tireDepthFrontRight: { x: 195, y: 190, fontSize: 9 },
    tireDepthRearLeft: { x: 170, y: 195, fontSize: 9 },
    tireDepthRearRight: { x: 195, y: 195, fontSize: 9 },
  },
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

    // 日本語フォントの読み込み
    // pdf-utilsのloadCustomFontを使用（fontkitを登録して正しく読み込む）
    const regularFontUrl = "/fonts/NotoSansJP-Regular.ttf";
    let japaneseFont = await loadCustomFont(pdfDoc, regularFontUrl, "NotoSansJP-Regular");

    if (!japaneseFont) {
      console.warn("[PDF] 日本語フォントの読み込みに失敗、Helveticaを使用");
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
    // const fontBoldToUse = japaneseFont || helveticaBoldFont; 

    // =============================================================================
    // テキストフィールドにデータを書き込む（ユーザー提供の座標を使用）
    // =============================================================================
    const coords = PDF_COORDINATES;

    // 依頼者(使用者) - 座標: { x: 100, y: 805, size: 10 }
    if (data.vehicle.ownerName) {
      drawTextWithAutoSize(
        firstPage,
        data.vehicle.ownerName,
        coords.header.ownerName.x,
        coords.header.ownerName.y,
        fontToUse,
        coords.header.ownerName.size,
        undefined, // maxWidth未指定（必要に応じて調整）
        rgb(0, 0, 0)
      );
    }

    // 車名及び型式 - 座標: { x: 320, y: 805, size: 10 }
    if (data.vehicle.vehicleName) {
      drawTextWithAutoSize(
        firstPage,
        data.vehicle.vehicleName,
        coords.header.carModel.x,
        coords.header.carModel.y,
        fontToUse,
        coords.header.carModel.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // 自動車登録番号又は車両番号 - 座標: { x: 460, y: 805, size: 10 }
    if (data.vehicle.licensePlate) {
      drawTextWithAutoSize(
        firstPage,
        data.vehicle.licensePlate,
        coords.header.registrationNumber.x,
        coords.header.registrationNumber.y,
        fontToUse,
        coords.header.registrationNumber.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // 原動機の型式（ある場合） - 座標: { x: 320, y: 780, size: 10 }
    if (data.vehicle.engineType) {
      drawTextWithAutoSize(
        firstPage,
        data.vehicle.engineType,
        coords.header.engineType.x,
        coords.header.engineType.y,
        fontToUse,
        coords.header.engineType.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // 車台番号（ある場合） - 座標: { x: 460, y: 780, size: 10 }
    if (data.vehicle.chassisNumber) {
      drawTextWithAutoSize(
        firstPage,
        data.vehicle.chassisNumber,
        coords.header.chassisNumber.x,
        coords.header.chassisNumber.y,
        fontToUse,
        coords.header.chassisNumber.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // 点検(整備)時の総走行距離 - 座標: { x: 430, y: 760, size: 10 }
    if (data.mileage !== null && data.mileage !== undefined) {
      const mileageText = `${data.mileage.toLocaleString()} km`;
      drawTextWithAutoSize(
        firstPage,
        mileageText,
        coords.header.mileage.x,
        coords.header.mileage.y,
        fontToUse,
        coords.header.mileage.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // 点検日 - フッター座標を使用
    const inspectionDate = new Date(data.inspectionDate);
    const dateYear = inspectionDate.getFullYear().toString();
    const dateMonth = (inspectionDate.getMonth() + 1).toString().padStart(2, "0");
    const dateDay = inspectionDate.getDate().toString().padStart(2, "0");
    
    // 点検日（年）
    drawTextWithAutoSize(
      firstPage,
      dateYear,
      coords.footer.dateYear.x,
      coords.footer.dateYear.y,
      fontToUse,
      coords.footer.dateYear.size,
      undefined,
      rgb(0, 0, 0)
    );
    
    // 点検日（月）
    drawTextWithAutoSize(
      firstPage,
      dateMonth,
      coords.footer.dateMonth.x,
      coords.footer.dateMonth.y,
      fontToUse,
      coords.footer.dateMonth.size,
      undefined,
      rgb(0, 0, 0)
    );
    
    // 点検日（日）
    drawTextWithAutoSize(
      firstPage,
      dateDay,
      coords.footer.dateDay.x,
      coords.footer.dateDay.y,
      fontToUse,
      coords.footer.dateDay.size,
      undefined,
      rgb(0, 0, 0)
    );

    // 整備主任者 - 座標: { x: 440, y: 45, size: 11 }
    if (data.mechanicName) {
      drawTextWithAutoSize(
        firstPage,
        data.mechanicName,
        coords.footer.mechanicName.x,
        coords.footer.mechanicName.y,
        fontToUse,
        coords.footer.mechanicName.size,
        undefined,
        rgb(0, 0, 0)
      );
    }

    // =============================================================================
    // 測定値を書き込む（ユーザー提供の座標を使用）
    // =============================================================================
    if (data.measurements) {
      const m = data.measurements;

      // CO濃度 - 座標: { x: 90, y: 108, size: 11 }
      if (m.coConcentration !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.coConcentration}%`,
          coords.measurements.coConcentration.x,
          coords.measurements.coConcentration.y,
          fontToUse,
          coords.measurements.coConcentration.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // HC濃度 - 座標: { x: 90, y: 85, size: 11 }
      if (m.hcConcentration !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.hcConcentration}ppm`,
          coords.measurements.hcConcentration.x,
          coords.measurements.hcConcentration.y,
          fontToUse,
          coords.measurements.hcConcentration.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // タイヤ溝（前輪左） - 座標: { x: 260, y: 120, size: 10 }
      if (m.tireDepthFrontLeft !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.tireDepthFrontLeft}mm`,
          coords.inspectData.tire.frontLeft.x,
          coords.inspectData.tire.frontLeft.y,
          fontToUse,
          coords.inspectData.tire.frontLeft.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // タイヤ溝（前輪右） - 座標: { x: 350, y: 120, size: 10 }
      if (m.tireDepthFrontRight !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.tireDepthFrontRight}mm`,
          coords.inspectData.tire.frontRight.x,
          coords.inspectData.tire.frontRight.y,
          fontToUse,
          coords.inspectData.tire.frontRight.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // タイヤ溝（後輪左） - 座標: { x: 260, y: 105, size: 10 }
      if (m.tireDepthRearLeft !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.tireDepthRearLeft}mm`,
          coords.inspectData.tire.rearLeft.x,
          coords.inspectData.tire.rearLeft.y,
          fontToUse,
          coords.inspectData.tire.rearLeft.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // タイヤ溝（後輪右） - 座標: { x: 350, y: 105, size: 10 }
      if (m.tireDepthRearRight !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.tireDepthRearRight}mm`,
          coords.inspectData.tire.rearRight.x,
          coords.inspectData.tire.rearRight.y,
          fontToUse,
          coords.inspectData.tire.rearRight.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // ブレーキパッド（前輪左） - 座標: { x: 260, y: 80, size: 10 }
      if (m.brakePadFrontLeft !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.brakePadFrontLeft}mm`,
          coords.inspectData.brake.frontLeft.x,
          coords.inspectData.brake.frontLeft.y,
          fontToUse,
          coords.inspectData.brake.frontLeft.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // ブレーキパッド（前輪右） - 座標: { x: 350, y: 80, size: 10 }
      if (m.brakePadFrontRight !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.brakePadFrontRight}mm`,
          coords.inspectData.brake.frontRight.x,
          coords.inspectData.brake.frontRight.y,
          fontToUse,
          coords.inspectData.brake.frontRight.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // ブレーキパッド（後輪左） - 座標: { x: 260, y: 65, size: 10 }
      if (m.brakePadRearLeft !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.brakePadRearLeft}mm`,
          coords.inspectData.brake.rearLeft.x,
          coords.inspectData.brake.rearLeft.y,
          fontToUse,
          coords.inspectData.brake.rearLeft.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // ブレーキパッド（後輪右） - 座標: { x: 350, y: 65, size: 10 }
      if (m.brakePadRearRight !== undefined) {
        drawTextWithAutoSize(
          firstPage,
          `${m.brakePadRearRight}mm`,
          coords.inspectData.brake.rearRight.x,
          coords.inspectData.brake.rearRight.y,
          fontToUse,
          coords.inspectData.brake.rearRight.size,
          undefined,
          rgb(0, 0, 0)
        );
      }
    }

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
      const xPt = mmToPt(position.x);
      const yPt = pageHeight - mmToPt(position.y); // pdf-libは左下が原点

      // 状態に応じてチェックマークを描画
      // 良好（green/good）、調整（adjust）、清掃（clean）の場合はレテン（✓）を描画
      // 24ヶ月点検リデザイン版のステータス値にも対応
      const status = item.status as string;
      const shouldDrawCheckmark =
        status === "green" ||
        status === "good" ||      // 24ヶ月リデザイン版: 良好
        status === "adjust" ||
        status === "clean" ||
        status === "ok";          // 従来版: OK

      if (shouldDrawCheckmark) {
        const checkSize = mmToPt(position.size || 3);
        drawCheckmark(
          firstPage,
          xPt,
          yPt,
          checkSize,
          japaneseFont
        );
      }

      // 交換（exchange/red）の場合は「×」を描画
      if (status === "exchange" || status === "red") {
        firstPage.drawText("×", {
          x: xPt,
          y: yPt,
          size: 10,
          font: fontToUse,
        });
      }

      // 修理（repair）の場合は「△」を描画
      if (status === "repair") {
        firstPage.drawText("△", {
          x: xPt,
          y: yPt,
          size: 10,
          font: fontToUse,
        });
      }

      // 省略（skip）の場合は「P」を描画
      if (status === "skip") {
        firstPage.drawText("P", {
          x: xPt,
          y: yPt,
          size: 10,
          font: fontToUse,
        });
      }

      // 該当なし（not_applicable）の場合は「／」を描画
      if (status === "not_applicable") {
        firstPage.drawText("/", {
          x: xPt,
          y: yPt,
          size: 10,
          font: fontToUse,
        });
      }

      // 測定値がある場合は、位置の近くにテキストで表示
      if (item.measurementValue !== undefined && item.measurement) {
        const measurementText = `${item.measurementValue}${item.measurement.unit}`;
        firstPage.drawText(measurementText, {
          x: xPt + mmToPt(10),
          y: yPt,
          size: 8,
          font: fontToUse,
        });
      }

      // コメントがある場合は、位置の近くにテキストで表示
      if (item.comment) {
        // pdf-libではmaxWidthはwidthパラメータとして指定
        firstPage.drawText(item.comment, {
          x: xPt + mmToPt(20),
          y: yPt,
          size: 8,
          font: fontToUse,
          maxWidth: mmToPt(100),
        });
      }
    }

    // =============================================================================
    // 交換部品を書き込む（ユーザー提供の座標を使用）
    // =============================================================================
    if (data.replacementParts && data.replacementParts.length > 0) {
      // エンジンオイル
      const engineOil = data.replacementParts.find((p) => p.name.includes("エンジンオイル"));
      if (engineOil) {
        drawTextWithAutoSize(
          firstPage,
          `${engineOil.quantity}${engineOil.unit}`,
          coords.exchangeParts.engineOilQty.x,
          coords.exchangeParts.engineOilQty.y,
          fontToUse,
          coords.exchangeParts.engineOilQty.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // オイルフィルター
      const oilFilter = data.replacementParts.find((p) => p.name.includes("オイルフィルター") || p.name.includes("フィルター"));
      if (oilFilter) {
        drawTextWithAutoSize(
          firstPage,
          `${oilFilter.quantity}${oilFilter.unit}`,
          coords.exchangeParts.oilFilterQty.x,
          coords.exchangeParts.oilFilterQty.y,
          fontToUse,
          coords.exchangeParts.oilFilterQty.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // LLC（ロングライフクーラント）
      const llc = data.replacementParts.find((p) => p.name.includes("LLC") || p.name.includes("クーラント"));
      if (llc) {
        drawTextWithAutoSize(
          firstPage,
          `${llc.quantity}${llc.unit}`,
          coords.exchangeParts.llcQty.x,
          coords.exchangeParts.llcQty.y,
          fontToUse,
          coords.exchangeParts.llcQty.size,
          undefined,
          rgb(0, 0, 0)
        );
      }

      // ブレーキフルード
      const brakeFluid = data.replacementParts.find((p) => p.name.includes("ブレーキフルード") || p.name.includes("ブレーキ"));
      if (brakeFluid) {
        drawTextWithAutoSize(
          firstPage,
          `${brakeFluid.quantity}${brakeFluid.unit}`,
          coords.exchangeParts.brakeFluidQty.x,
          coords.exchangeParts.brakeFluidQty.y,
          fontToUse,
          coords.exchangeParts.brakeFluidQty.size,
          undefined,
          rgb(0, 0, 0)
        );
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
