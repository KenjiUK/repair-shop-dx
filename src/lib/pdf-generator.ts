/**
 * 見積書PDF生成エンジン
 * pdf-libを使用して見積書PDFを生成
 */

import { EstimateLineItem, EstimatePriority } from "@/types";
import { calculateTax } from "./tax-calculation";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadCustomFont, drawText as drawTextHelper, splitTextToSize, drawLine } from "./pdf-utils";

/**
 * 見積書PDF生成オプション
 */
export interface EstimatePdfOptions {
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** ナンバープレート */
  licensePlate?: string;
  /** 見積項目 */
  items: EstimateLineItem[];
  /** 税込表示かどうか */
  isTaxIncluded?: boolean;
  /** 見積日 */
  estimateDate?: Date;
  /** 見積有効期限 */
  validUntil?: Date;
  /** 備考 */
  note?: string;
}

/**
 * 見積書PDFを生成
 */
export async function generateEstimatePdf(options: EstimatePdfOptions): Promise<PDFDocument> {
  const {
    customerName,
    vehicleName,
    licensePlate,
    items,
    isTaxIncluded = true,
    estimateDate = new Date(),
    validUntil,
    note,
  } = options;

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

  if (!regularFont) regularFont = fallbackFont;
  if (!boldFont) boldFont = regularFont || fallbackBoldFont;

  // ページ設定 (A4)
  let page = doc.addPage([595.28, 841.89]);

  const pageWidth = 210; // mm
  // const pageHeight = 297; // mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Helper to check page break
  const checkPageBreak = (heightNeeded: number) => {
    if (currentY + heightNeeded > 277) {
      page = doc.addPage([595.28, 841.89]);
      currentY = margin;
    }
  };

  // ヘッダー（タイトル）
  drawTextHelper(page, "見積書", pageWidth / 2, currentY, boldFont, 20, rgb(0, 0, 0), { align: "center" });
  currentY += 15;

  // 見積日
  const dateStr = formatDate(estimateDate);
  drawTextHelper(page, `見積日: ${dateStr}`, pageWidth - margin, currentY, regularFont, 10, rgb(0, 0, 0), { align: "right" });
  currentY += 8;

  // 顧客情報セクション
  drawTextHelper(page, "お客様情報", margin, currentY, boldFont, 12);
  currentY += 8;

  drawTextHelper(page, `お客様名: ${customerName}`, margin, currentY, regularFont, 10);
  currentY += 7;

  const vehicleInfo = licensePlate
    ? `${vehicleName} / ${licensePlate}`
    : vehicleName;
  drawTextHelper(page, `車両: ${vehicleInfo}`, margin, currentY, regularFont, 10);
  currentY += 10;

  // 見積明細セクション
  drawTextHelper(page, "見積明細", margin, currentY, boldFont, 12);
  currentY += 10;

  // 見積項目を優先度でグループ化
  const itemsByPriority = {
    required: items.filter((item) => item.priority === "required"),
    recommended: items.filter((item) => item.priority === "recommended"),
    optional: items.filter((item) => item.priority === "optional"),
  };

  // 優先度ごとにセクションを出力
  const priorityLabels = {
    required: "必須整備",
    recommended: "推奨整備",
    optional: "任意整備",
  };

  let totalSubtotal = 0;

  for (const [priority, priorityItems] of Object.entries(itemsByPriority)) {
    if (priorityItems.length === 0) continue;

    // セクションタイトル
    if (Object.keys(itemsByPriority).length > 1) {
      checkPageBreak(15);
      drawTextHelper(page, priorityLabels[priority as EstimatePriority], margin, currentY, boldFont, 10);
      currentY += 7;
    }

    // テーブルヘッダー
    checkPageBreak(10);
    const headerY = currentY;
    drawTextHelper(page, "作業内容", margin, headerY, boldFont, 9);
    drawTextHelper(page, "数量", margin + 70, headerY, boldFont, 9, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, "単価", margin + 90, headerY, boldFont, 9, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, "部品代", margin + 110, headerY, boldFont, 9, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, "技術量", margin + 130, headerY, boldFont, 9, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, "合計", margin + 150, headerY, boldFont, 9, rgb(0, 0, 0), { align: "right" });
    currentY += 6;

    // 区切り線
    drawLine(page, margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // 明細行
    for (const item of priorityItems) {
      const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
      const laborTotal = item.laborCost || 0;
      const itemTotal = partTotal + laborTotal;
      totalSubtotal += itemTotal;

      // 作業内容（複数行対応）
      // splitTextToSize roughly calculates characters width. 
      // 65mm is roughly 184 pt.
      const maxWidthPt = 184;
      const lines = splitTextToSize(item.name || "", regularFont, 9, maxWidthPt);
      const itemHeight = Math.max(lines.length * 5, 7);

      checkPageBreak(itemHeight + 3);

      let lineY = currentY;
      for (const line of lines) {
        drawTextHelper(page, line, margin, lineY, regularFont, 9);
        lineY += 5;
      }

      const rowCenterY = currentY + (itemHeight > 7 ? itemHeight / 2 : 0) - (lines.length > 1 ? 2 : 0); // rough centering fix

      // 数量
      drawTextHelper(page, (item.partQuantity || 0).toString(), margin + 70, rowCenterY, regularFont, 9, rgb(0, 0, 0), { align: "right" });

      // 単価
      drawTextHelper(page, formatPrice(item.partUnitPrice || 0), margin + 90, rowCenterY, regularFont, 9, rgb(0, 0, 0), { align: "right" });

      // 部品代
      drawTextHelper(page, formatPrice(partTotal), margin + 110, rowCenterY, regularFont, 9, rgb(0, 0, 0), { align: "right" });

      // 技術量
      drawTextHelper(page, formatPrice(laborTotal), margin + 130, rowCenterY, regularFont, 9, rgb(0, 0, 0), { align: "right" });

      // 合計
      drawTextHelper(page, formatPrice(itemTotal), margin + 150, rowCenterY, regularFont, 9, rgb(0, 0, 0), { align: "right" });

      currentY += itemHeight + 3;
    }

    currentY += 5;
  }

  // 合計セクション
  currentY += 5;

  // 区切り線
  drawLine(page, margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // 小計（税抜）
  checkPageBreak(30);
  drawTextHelper(page, "小計（税抜）:", margin + 100, currentY, regularFont, 10, rgb(0, 0, 0), { align: "right" });
  drawTextHelper(page, formatPrice(totalSubtotal), margin + 150, currentY, boldFont, 10, rgb(0, 0, 0), { align: "right" });
  currentY += 7;

  if (isTaxIncluded) {
    // 消費税
    const taxCalculation = calculateTax(totalSubtotal);
    drawTextHelper(page, `消費税（${taxCalculation.taxRate}%）:`, margin + 100, currentY, regularFont, 10, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, formatPrice(taxCalculation.tax), margin + 150, currentY, boldFont, 10, rgb(0, 0, 0), { align: "right" });
    currentY += 7;

    // 合計（税込）
    drawTextHelper(page, "合計（税込）:", margin + 100, currentY, boldFont, 12, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, formatPrice(taxCalculation.total), margin + 150, currentY, boldFont, 12, rgb(0, 0, 0), { align: "right" });
  } else {
    // 合計（税抜）
    drawTextHelper(page, "合計（税抜）:", margin + 100, currentY, boldFont, 12, rgb(0, 0, 0), { align: "right" });
    drawTextHelper(page, formatPrice(totalSubtotal), margin + 150, currentY, boldFont, 12, rgb(0, 0, 0), { align: "right" });
  }

  currentY += 15;

  // 有効期限
  if (validUntil) {
    checkPageBreak(10);
    drawTextHelper(page, `有効期限: ${formatDate(validUntil)}`, margin, currentY, regularFont, 9);
    currentY += 10;
  }

  // 備考
  if (note) {
    const maxWidthPt = mmToPt(contentWidth);
    const noteLines = splitTextToSize(`備考: ${note}`, regularFont, 9, maxWidthPt);
    checkPageBreak(noteLines.length * 5 + 5);

    for (const line of noteLines) {
      drawTextHelper(page, line, margin, currentY, regularFont, 9);
      currentY += 5;
    }
  }

  // フッター（会社情報など）
  // Always on the bottom of the last page, or new page if no space?
  // Let's simplified: put it at the bottom of current page or 280mm
  const footerY = 280; // mm
  drawTextHelper(page, "この見積書はシステムにより自動生成されました。", pageWidth / 2, footerY, regularFont, 8, rgb(0.5, 0.5, 0.5), { align: "center" });

  return doc;
}

/**
 * 見積書PDFをダウンロード
 */
export async function downloadEstimatePdf(options: EstimatePdfOptions, filename?: string): Promise<void> {
  const doc = await generateEstimatePdf(options);
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `見積書_${options.customerName}_${formatDate(new Date(), "YYYYMMDD")}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || defaultFilename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * 見積書PDFのBlob URLを取得（プレビュー用）
 */
export async function getEstimatePdfBlobUrl(options: EstimatePdfOptions): Promise<string> {
  const doc = await generateEstimatePdf(options);
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/**
 * 価格をフォーマット（カンマ区切り）
 */
function formatPrice(price: number): string {
  return `¥${new Intl.NumberFormat("ja-JP").format(price)}`;
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date, format: string = "YYYY年MM月DD日"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day);
}
