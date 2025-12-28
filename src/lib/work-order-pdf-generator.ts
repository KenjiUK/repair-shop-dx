/**
 * 作業指示書PDF生成機能
 *
 * メカニック向けの統合された作業指示書をPDF形式で生成
 */

import { ApiResponse, WorkOrderPDFData, ServiceKind } from "@/types";
import { fetchHistoricalJobsByCustomerId } from "@/lib/api";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { loadCustomFont, drawText as drawTextHelper, splitTextToSize, drawLine, drawRect, mmToPt } from "./pdf-utils";

// =============================================================================
// PDF生成
// =============================================================================

/**
 * テキストボックスを描画するヘルパー関数
 * 背景を先に描画し、その後にテキストを描画する
 */
function drawTextBox(
  page: PDFPage,
  text: string,
  startY: number,
  options: {
    margin: { left: number; right: number };
    fontSize: number;
    lineHeight: number;
    padding: number;
    fillColor: [number, number, number]; // 0-1 range for pdf-lib rgb
    borderColor: [number, number, number]; // 0-1 range for pdf-lib rgb
    font: PDFFont;
  }
): number {
  const { margin, fontSize, lineHeight, padding, fillColor, borderColor, font } = options;
  const maxWidthPt = mmToPt(210 - margin.left - margin.right - padding * 2);

  // テキストを複数行に分割
  const lines = splitTextToSize(text, font, fontSize, maxWidthPt);

  // ボックスの高さを計算
  const boxHeight = lines.length * lineHeight + padding * 2;

  // 背景ボックスを先に描画
  drawRect(page, margin.left, startY, 210 - margin.left - margin.right, boxHeight, {
    fillColor: rgb(fillColor[0], fillColor[1], fillColor[2]),
    borderColor: rgb(borderColor[0], borderColor[1], borderColor[2]),
    borderWidth: 0.5,
  });

  // テキストを描画
  let currentY = startY + padding + fontSize * 0.35 * 0.35; // Rough baseline adjustment, pdf-lib handles differently but let's stick to accumulating Y
  // Actually my drawTextHelper takes "baseline from top" roughly?
  // Let's just accumulate Y.

  // Re-adjust currentY to be the first line position.
  currentY = startY + padding;

  for (const line of lines) {
    drawTextHelper(page, line, margin.left + padding, currentY, font, fontSize, rgb(0, 0, 0));
    currentY += lineHeight;
  }

  return startY + boxHeight;
}

/**
 * 作業指示書PDFを生成
 */
export async function generateWorkOrderPDF(
  data: WorkOrderPDFData
): Promise<ApiResponse<Blob>> {
  try {
    const doc = await PDFDocument.create();

    const regularFontUrl = "/fonts/NotoSansJP-Regular.ttf";
    const boldFontUrl = "/fonts/NotoSansJP-Bold.ttf";

    let regularFont = await loadCustomFont(doc, regularFontUrl, "NotoSansJP-Regular");
    let boldFont = await loadCustomFont(doc, boldFontUrl, "NotoSansJP-Bold");

    const fallbackFont = await doc.embedFont(StandardFonts.Helvetica);
    const fallbackBoldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    if (!regularFont) regularFont = fallbackFont;
    if (!boldFont) boldFont = regularFont || fallbackBoldFont;

    const fontSize = {
      title: 22,
      heading: 16,
      normal: 12,
      small: 10,
    };

    const margin = {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
    };

    let page = doc.addPage([595.28, 841.89]);
    let yPosition = margin.top;

    // Helper to add page
    const checkPageBreak = (heightNeeded: number) => {
      if (yPosition + heightNeeded > 277) {
        page = doc.addPage([595.28, 841.89]);
        yPosition = margin.top;
      }
    };

    // =============================================================================
    // ヘッダー（タイトル + 生成日時）
    // =============================================================================
    drawTextHelper(page, "作業指示書", 105, yPosition, boldFont, fontSize.title, rgb(0, 0, 0), { align: "center" });
    yPosition += 10;

    const generatedDate = new Date(data.generatedAt);
    const generatedDateStr = generatedDate.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });

    drawTextHelper(page, `生成日時: ${generatedDateStr}`, 105, yPosition, regularFont, fontSize.small, rgb(0.4, 0.4, 0.4), { align: "center" });
    yPosition += 8;

    // 区切り線
    drawLine(page, margin.left, yPosition, 210 - margin.right, yPosition, 0.8, rgb(0.2, 0.2, 0.2));
    yPosition += 10;

    // =============================================================================
    // 基本情報（テーブル形式）
    // =============================================================================
    drawTextHelper(page, "基本情報", margin.left, yPosition, boldFont, fontSize.heading);
    yPosition += 8;

    // 左列の情報
    const leftColumnItems: Array<{ label: string; value: string }> = [
      { label: "顧客名", value: data.customerName },
      {
        label: "車両",
        value: data.vehicleInfo.licensePlate
          ? `${data.vehicleInfo.name} / ${data.vehicleInfo.licensePlate}`
          : data.vehicleInfo.name,
      },
      {
        label: "入庫日時",
        value: new Date(data.entryDate).toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Tokyo",
        }),
      },
    ];

    // 右列の情報
    const rightColumnItems: Array<{ label: string; value: string }> = [
      { label: "サービス種別", value: data.serviceKind },
    ];

    if (data.assignedMechanic) {
      rightColumnItems.push({ label: "担当整備士", value: data.assignedMechanic });
    }

    if (data.mileage !== null && data.mileage !== undefined) {
      rightColumnItems.push({ label: "走行距離", value: `${data.mileage.toLocaleString()} km` });
    }

    if (data.tagId) {
      rightColumnItems.push({ label: "タグNo.", value: data.tagId });
    }

    if (data.courtesyCar) {
      const courtesyCarText = data.courtesyCar.licensePlate
        ? `${data.courtesyCar.name} / ${data.courtesyCar.licensePlate}（貸出中）`
        : `${data.courtesyCar.name}（貸出中）`;
      rightColumnItems.push({ label: "代車", value: courtesyCarText });
    }

    // ボックスの高さを計算
    const maxRows = Math.max(leftColumnItems.length, rightColumnItems.length);
    const rowHeight = 8;
    const infoBoxPadding = 6;
    const infoBoxHeight = maxRows * rowHeight + infoBoxPadding * 2;

    // 背景ボックスを先に描画
    // Color 248, 250, 252 -> normalized: 0.97, 0.98, 0.99
    // Color 203, 213, 225 -> normalized: 0.80, 0.84, 0.88
    drawRect(page, margin.left, yPosition, 210 - margin.left - margin.right, infoBoxHeight, {
      fillColor: rgb(248 / 255, 250 / 255, 252 / 255),
      borderColor: rgb(203 / 255, 213 / 255, 225 / 255),
      borderWidth: 0.5
    });

    // テキストを描画
    const leftColumnX = margin.left + infoBoxPadding;
    const rightColumnX = margin.left + 100;

    // 左列を表示
    let currentY = yPosition + infoBoxPadding + 2; // +2 reasonable offset
    leftColumnItems.forEach((item) => {
      const labelText = `${item.label}:`;
      drawTextHelper(page, labelText, leftColumnX, currentY, boldFont, fontSize.normal);

      const labelWidth = boldFont.widthOfTextAtSize(labelText, fontSize.normal);
      // Convert width to mm? normalize. pdf-lib width is in points. 
      // My drawTextHelper expects x in mm.
      // 1 pt = 1/2.83465 mm. widthInMm = width / 2.83465.
      const labelWidthMm = labelWidth / 2.83465;

      drawTextHelper(page, item.value || "", leftColumnX + labelWidthMm + 3, currentY, regularFont, fontSize.normal);
      currentY += rowHeight;
    });

    // 右列を表示
    currentY = yPosition + infoBoxPadding + 2;
    rightColumnItems.forEach((item) => {
      const labelText = `${item.label}:`;
      drawTextHelper(page, labelText, rightColumnX, currentY, boldFont, fontSize.normal);

      const labelWidth = boldFont.widthOfTextAtSize(labelText, fontSize.normal);
      const labelWidthMm = labelWidth / 2.83465;

      // 値が長い場合は複数行に分割
      const maxValueWidthPt = mmToPt(210 - margin.right - rightColumnX - labelWidthMm - 8);
      const valueLines = splitTextToSize(item.value || "", regularFont, fontSize.normal, maxValueWidthPt);

      valueLines.forEach((line: string, lineIndex: number) => {
        drawTextHelper(page, line, rightColumnX + labelWidthMm + 3, currentY + lineIndex * 5, regularFont, fontSize.normal);
      });
      currentY += rowHeight;
    });

    yPosition += infoBoxHeight + 10;

    // =============================================================================
    // 顧客からの申し送り事項
    // =============================================================================
    if (data.customerNotes) {
      checkPageBreak(30);

      drawTextHelper(page, "顧客からの申し送り事項", margin.left, yPosition, boldFont, fontSize.heading);
      yPosition += 8;

      yPosition = drawTextBox(doc.getPage(doc.getPageCount() - 1), data.customerNotes, yPosition, {
        margin,
        fontSize: fontSize.normal,
        lineHeight: 7,
        padding: 5,
        fillColor: [255 / 255, 251 / 255, 235 / 255],
        borderColor: [251 / 255, 191 / 255, 36 / 255],
        font: regularFont,
      });

      yPosition += 10;
    }

    // =============================================================================
    // 受付メモ（受付スタッフからの指示）
    // =============================================================================
    if (data.workOrder) {
      checkPageBreak(30);

      drawTextHelper(page, "受付メモ", margin.left, yPosition, boldFont, fontSize.heading);
      yPosition += 8;

      yPosition = drawTextBox(doc.getPage(doc.getPageCount() - 1), data.workOrder, yPosition, {
        margin,
        fontSize: fontSize.normal,
        lineHeight: 7,
        padding: 5,
        fillColor: [255 / 255, 247 / 255, 237 / 255],
        borderColor: [251 / 255, 146 / 255, 60 / 255],
        font: regularFont,
      });

      yPosition += 10;
    }

    // =============================================================================
    // 承認済み作業内容（作業待ち以降のみ表示）
    // =============================================================================
    if (data.approvedWorkItems) {
      checkPageBreak(30);

      drawTextHelper(page, "承認済み作業内容", margin.left, yPosition, boldFont, fontSize.heading);
      yPosition += 8;

      yPosition = drawTextBox(doc.getPage(doc.getPageCount() - 1), data.approvedWorkItems, yPosition, {
        margin,
        fontSize: fontSize.normal,
        lineHeight: 7,
        padding: 5,
        fillColor: [239 / 255, 246 / 255, 255 / 255],
        borderColor: [96 / 255, 165 / 255, 250 / 255],
        font: regularFont,
      });

      yPosition += 10;
    }

    // =============================================================================
    // 過去の作業履歴（関連情報）
    // =============================================================================
    if (data.historicalJobs && data.historicalJobs.length > 0) {
      checkPageBreak(30);

      drawTextHelper(page, "過去の作業履歴", margin.left, yPosition, boldFont, fontSize.heading);
      yPosition += 8;

      // 履歴テキストを生成
      const historyText = data.historicalJobs
        .map((item, index) => `${index + 1}. ${item.date} - ${item.serviceKind}: ${item.summary}`)
        .join("\n");

      yPosition = drawTextBox(doc.getPage(doc.getPageCount() - 1), historyText, yPosition, {
        margin,
        fontSize: fontSize.normal,
        lineHeight: 7,
        padding: 5,
        fillColor: [248 / 255, 250 / 255, 252 / 255],
        borderColor: [203 / 255, 213 / 255, 225 / 255],
        font: regularFont,
      });

      yPosition += 10;
    }

    // =============================================================================
    // フッター（ページ番号）
    // =============================================================================
    const pageCount = doc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const p = doc.getPage(i);

      drawLine(p, margin.left, 280, 210 - margin.right, 280, 0.3, rgb(200 / 255, 200 / 255, 200 / 255));

      drawTextHelper(p, `${i + 1} / ${pageCount}`, 105, 287, regularFont, fontSize.small, rgb(100 / 255, 100 / 255, 100 / 255), { align: "center" });
    }

    const pdfBytes = await doc.save();
    const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

    return { success: true, data: pdfBlob };
  } catch (error) {
    console.error("[PDF] 作業指示書PDF生成エラー:", error);
    return {
      success: false,
      error: {
        code: "PDF_GENERATION_ERROR",
        message: error instanceof Error ? error.message : "PDF生成に失敗しました",
      },
    };
  }
}

/**
 * ジョブ情報から作業指示書PDFデータを生成
 */
export async function createWorkOrderPDFDataFromJob(job: {
  id: string;
  field4: { name: string; id?: string } | null;
  field6: { name: string } | null;
  field22: string | null;
  field?: string | null;
  field7?: string | null;
  field10?: number | null;
  field13?: string | null;
  serviceKind?: ServiceKind | null;
  field_service_kinds?: ServiceKind[] | null;
  assignedMechanic?: string | null;
  tagId?: string | null;
  courtesyCar?: {
    name: string;
    licensePlate?: string;
  } | null;
}): Promise<WorkOrderPDFData | null> {
  if (!job.field4 || !job.field6) {
    return null;
  }

  const vehicleInfo = job.field6.name || "";
  const vehicleParts = vehicleInfo.split(" / ");
  const vehicleName = vehicleParts[0] || vehicleInfo;
  const licensePlate = vehicleParts[1] || "";

  const serviceKind = job.field_service_kinds?.[0] || job.serviceKind || ("一般整備" as ServiceKind);

  let customerNotes = job.field7 || null;
  if (customerNotes) {
    customerNotes = customerNotes.replace(/【一時帰宅情報】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    customerNotes = customerNotes.replace(/【車検チェックリスト】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    customerNotes = customerNotes.replace(/【エラーランプ情報】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    if (!customerNotes || customerNotes.length === 0) {
      customerNotes = null;
    }
  }

  let historicalJobs: WorkOrderPDFData["historicalJobs"] = null;
  if (job.field4.id) {
    try {
      const historicalJobsResult = await fetchHistoricalJobsByCustomerId(job.field4.id, {
        statusFilter: "completed",
      });

      if (historicalJobsResult.success && historicalJobsResult.data) {
        const filteredJobs = historicalJobsResult.data.filter((hJob) => hJob.id !== job.id);
        const limitedJobs = filteredJobs.slice(0, 5);

        historicalJobs = limitedJobs.map((hJob) => {
          const serviceKindText = hJob.status === "出庫済み" ? "整備完了" : hJob.status;
          const date = hJob.arrivalDateTime || hJob.createdAt;
          const dateStr = date
            ? new Date(date).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            : "";

          return {
            date: dateStr,
            serviceKind: serviceKindText,
            summary: `${hJob.vehicleName} - ${serviceKindText}`,
          };
        });

        if (historicalJobs.length === 0) {
          historicalJobs = null;
        }
      }
    } catch (error) {
      console.error("[PDF] 過去の作業履歴の取得に失敗:", error);
      historicalJobs = null;
    }
  }

  return {
    jobId: job.id,
    customerName: job.field4.name,
    vehicleInfo: {
      name: vehicleName,
      licensePlate: licensePlate,
    },
    entryDate: job.field22 || new Date().toISOString(),
    workOrder: job.field || null,
    serviceKind: serviceKind,
    assignedMechanic: job.assignedMechanic || null,
    customerNotes: customerNotes,
    generatedAt: new Date().toISOString(),
    mileage: job.field10 || null,
    tagId: job.tagId || null,
    courtesyCar: job.courtesyCar || null,
    approvedWorkItems: job.field13 || null,
    historicalJobs: historicalJobs,
  };
}
