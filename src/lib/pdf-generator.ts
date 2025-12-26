/**
 * 見積書PDF生成エンジン
 * jsPDFを使用して見積書PDFを生成
 * 
 * パフォーマンス最適化: jsPDFは動的インポートで読み込む（コード分割）
 */

import { EstimateLineItem, EstimatePriority } from "@/types";
import { calculateTax } from "./tax-calculation";

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
 * パフォーマンス最適化: jsPDFを動的インポートで読み込む
 */
export async function generateEstimatePdf(options: EstimatePdfOptions): Promise<import("jspdf").jsPDF> {
  // 動的インポート（コード分割）
  const { jsPDF } = await import("jspdf");
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

  // PDFドキュメントを作成（A4サイズ）
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // ページ設定
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // ヘッダー（タイトル）
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("見積書", pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // 見積日
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = formatDate(estimateDate);
  doc.text(`見積日: ${dateStr}`, pageWidth - margin, currentY, { align: "right" });
  currentY += 8;

  // 顧客情報セクション
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("お客様情報", margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`お客様名: ${customerName}`, margin, currentY);
  currentY += 7;
  
  const vehicleInfo = licensePlate 
    ? `${vehicleName} / ${licensePlate}`
    : vehicleName;
  doc.text(`車両: ${vehicleInfo}`, margin, currentY);
  currentY += 10;

  // 見積明細セクション
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("見積明細", margin, currentY);
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
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(priorityLabels[priority as EstimatePriority], margin, currentY);
      currentY += 7;
    }

    // テーブルヘッダー
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const headerY = currentY;
    doc.text("作業内容", margin, headerY);
    doc.text("数量", margin + 70, headerY, { align: "right" });
    doc.text("単価", margin + 90, headerY, { align: "right" });
    doc.text("部品代", margin + 110, headerY, { align: "right" });
    doc.text("技術量", margin + 130, headerY, { align: "right" });
    doc.text("合計", margin + 150, headerY, { align: "right" });
    currentY += 6;

    // 区切り線
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // 明細行
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    for (const item of priorityItems) {
      // ページ分割チェック
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
      const laborTotal = item.laborCost || 0;
      const itemTotal = partTotal + laborTotal;
      totalSubtotal += itemTotal;

      // 作業内容（複数行対応）
      const lines = doc.splitTextToSize(item.name || "", 65);
      doc.text(lines, margin, currentY);
      
      const itemHeight = Math.max(lines.length * 5, 7);
      
      // 数量
      doc.text(
        (item.partQuantity || 0).toString(),
        margin + 70,
        currentY + (itemHeight > 7 ? itemHeight / 2 : 0),
        { align: "right" }
      );
      
      // 単価
      doc.text(
        formatPrice(item.partUnitPrice || 0),
        margin + 90,
        currentY + (itemHeight > 7 ? itemHeight / 2 : 0),
        { align: "right" }
      );
      
      // 部品代
      doc.text(
        formatPrice(partTotal),
        margin + 110,
        currentY + (itemHeight > 7 ? itemHeight / 2 : 0),
        { align: "right" }
      );
      
      // 技術量
      doc.text(
        formatPrice(laborTotal),
        margin + 130,
        currentY + (itemHeight > 7 ? itemHeight / 2 : 0),
        { align: "right" }
      );
      
      // 合計
      doc.text(
        formatPrice(itemTotal),
        margin + 150,
        currentY + (itemHeight > 7 ? itemHeight / 2 : 0),
        { align: "right" }
      );

      currentY += itemHeight + 3;
    }

    currentY += 5;
  }

  // 合計セクション
  currentY += 5;
  
  // 区切り線
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // 小計（税抜）
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("小計（税抜）:", margin + 100, currentY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(formatPrice(totalSubtotal), margin + 150, currentY, { align: "right" });
  currentY += 7;

  if (isTaxIncluded) {
    // 消費税
    const taxCalculation = calculateTax(totalSubtotal);
    doc.setFont("helvetica", "normal");
    doc.text(`消費税（${taxCalculation.taxRate}%）:`, margin + 100, currentY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatPrice(taxCalculation.tax), margin + 150, currentY, { align: "right" });
    currentY += 7;

    // 合計（税込）
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("合計（税込）:", margin + 100, currentY, { align: "right" });
    doc.text(formatPrice(taxCalculation.total), margin + 150, currentY, { align: "right" });
  } else {
    // 合計（税抜）
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("合計（税抜）:", margin + 100, currentY, { align: "right" });
    doc.text(formatPrice(totalSubtotal), margin + 150, currentY, { align: "right" });
  }

  currentY += 15;

  // 有効期限
  if (validUntil) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`有効期限: ${formatDate(validUntil)}`, margin, currentY);
    currentY += 10;
  }

  // 備考
  if (note) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(`備考: ${note}`, contentWidth);
    doc.text(noteLines, margin, currentY);
    currentY += noteLines.length * 5 + 5;
  }

  // フッター（会社情報など）
  currentY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text("この見積書はシステムにより自動生成されました。", pageWidth / 2, currentY, { align: "center" });

  return doc;
}

/**
 * 見積書PDFをダウンロード
 * パフォーマンス最適化: jsPDFを動的インポートで読み込む
 */
export async function downloadEstimatePdf(options: EstimatePdfOptions, filename?: string): Promise<void> {
  const doc = await generateEstimatePdf(options);
  const defaultFilename = `見積書_${options.customerName}_${formatDate(new Date(), "YYYYMMDD")}.pdf`;
  doc.save(filename || defaultFilename);
}

/**
 * 見積書PDFのBlob URLを取得（プレビュー用）
 * パフォーマンス最適化: jsPDFを動的インポートで読み込む
 */
export async function getEstimatePdfBlobUrl(options: EstimatePdfOptions): Promise<string> {
  const doc = await generateEstimatePdf(options);
  const blob = doc.output("blob");
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


