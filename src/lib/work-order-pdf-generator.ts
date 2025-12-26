/**
 * 作業指示書PDF生成機能
 *
 * メカニック向けの統合された作業指示書をPDF形式で生成
 * 
 * 含まれる情報:
 * - 基本情報（顧客名、車両、入庫日時、サービス種別、担当整備士、走行距離、タグ、代車）
 * - 顧客からの申し送り事項
 * - 受付メモ（受付スタッフからの指示）
 * - 承認済み作業内容（作業待ち以降）
 */

import { ApiResponse, WorkOrderPDFData, ServiceKind } from "@/types";
import { NOTO_SANS_JP_REGULAR, isJapaneseFontAvailable } from "@/lib/japanese-font-data";
import { fetchHistoricalJobsByCustomerId } from "@/lib/api";

// =============================================================================
// PDF生成
// =============================================================================

/**
 * 作業指示書PDFを生成
 *
 * @param data 作業指示書データ
 * @returns PDF Blob
 */
/**
 * 日本語フォントを読み込んでjsPDFに追加
 * 
 * フォントファイルは public/fonts/ に配置されていることを前提とします。
 */
async function loadJapaneseFont(doc: any): Promise<boolean> {
  try {
    // フォントファイルをpublicフォルダから読み込む
    const regularFontUrl = "/fonts/NotoSansJP-Regular.ttf";
    const boldFontUrl = "/fonts/NotoSansJP-Bold.ttf";
    
    console.log("[PDF] 日本語フォントの読み込みを開始:", regularFontUrl);
    
    // フォントファイルをフェッチしてBase64エンコード
    const [regularResponse, boldResponse] = await Promise.all([
      fetch(regularFontUrl).catch((err) => {
        console.error("[PDF] Regularフォントのフェッチエラー:", err);
        return null;
      }),
      fetch(boldFontUrl).catch((err) => {
        console.error("[PDF] Boldフォントのフェッチエラー:", err);
        return null;
      }),
    ]);
    
    if (!regularResponse || !regularResponse.ok) {
      console.warn("[PDF] 日本語フォントファイルが見つかりません:", regularFontUrl, regularResponse?.status);
      return false;
    }
    
    console.log("[PDF] フォントファイルのフェッチ成功。Base64エンコード中...");
    const regularBlob = await regularResponse.blob();
    const regularBase64 = await blobToBase64(regularBlob);
    
    console.log("[PDF] Base64エンコード完了。フォントサイズ:", regularBase64.length, "文字");
    
    // Regularフォントを追加
    try {
      doc.addFileToVFS("NotoSansJP-Regular.ttf", regularBase64);
      doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
      console.log("[PDF] Regularフォントの追加に成功");
    } catch (fontError) {
      console.error("[PDF] Regularフォントの追加に失敗:", fontError);
      return false;
    }
    
    // Boldフォントも追加（利用可能な場合）
    if (boldResponse && boldResponse.ok) {
      try {
        const boldBlob = await boldResponse.blob();
        const boldBase64 = await blobToBase64(boldBlob);
        doc.addFileToVFS("NotoSansJP-Bold.ttf", boldBase64);
        doc.addFont("NotoSansJP-Bold.ttf", "NotoSansJP", "bold");
        console.log("[PDF] Boldフォントの追加に成功");
      } catch (boldError) {
        console.warn("[PDF] Boldフォントの追加に失敗（Regularフォントのみ使用）:", boldError);
        // Boldフォントの追加に失敗しても、Regularフォントは使用可能なので続行
      }
    } else {
      console.warn("[PDF] Boldフォントファイルが見つかりません。Regularフォントのみ使用します。");
    }
    
    console.log("[PDF] 日本語フォントの読み込み完了");
    return true;
  } catch (error) {
    console.error("[PDF] 日本語フォントの読み込みに失敗:", error);
    return false;
  }
}

/**
 * BlobをBase64文字列に変換
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateWorkOrderPDF(
  data: WorkOrderPDFData
): Promise<ApiResponse<Blob>> {
  try {
    // 動的インポート（クライアント側でのみ使用）
    const { jsPDF } = await import("jspdf");

    // PDFドキュメントを作成（A4サイズ）
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: false, // 日本語フォントの互換性のため圧縮を無効化
    });

    // 日本語フォントを読み込む（awaitを追加）
    const fontLoaded = await loadJapaneseFont(doc);
    
    // 使用するフォント名を決定
    const fontName = fontLoaded ? "NotoSansJP" : "helvetica";
    
    // フォントが読み込まれなかった場合の警告
    if (!fontLoaded) {
      console.warn("[PDF] 日本語フォントが読み込めませんでした。文字化けが発生する可能性があります。");
    }

    // フォントサイズ設定
    const fontSize = {
      title: 20,
      heading: 14,
      normal: 11,
      small: 9,
    };

    // マージン設定
    const margin = {
      top: 25,
      left: 20,
      right: 20,
      bottom: 25,
    };

    let yPosition = margin.top;

    // =============================================================================
    // タイトル
    // =============================================================================
    doc.setFontSize(fontSize.title);
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "bold");
    } else {
      doc.setFont("helvetica", "bold");
    }
    doc.text("作業指示書", 105, yPosition, { align: "center" });
    yPosition += 15;

    // 区切り線
    doc.setLineWidth(0.5);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin.left, yPosition, 210 - margin.right, yPosition);
    yPosition += 8;

    // =============================================================================
    // 基本情報
    // =============================================================================
    doc.setFontSize(fontSize.heading);
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "bold");
    } else {
      doc.setFont("helvetica", "bold");
    }
    doc.text("【基本情報】", margin.left, yPosition);
    yPosition += 8;

    doc.setFontSize(fontSize.normal);
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "normal");
    } else {
      doc.setFont("helvetica", "normal");
    }
    
    // 情報をテーブル形式で表示
    const infoItems = [
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
      { label: "サービス種別", value: data.serviceKind },
    ];

    if (data.assignedMechanic) {
      infoItems.push({ label: "担当整備士", value: data.assignedMechanic });
    }

    // 走行距離を追加
    if (data.mileage !== null && data.mileage !== undefined) {
      infoItems.push({ label: "走行距離", value: `${data.mileage.toLocaleString()} km` });
    }

    // タグ情報を追加
    if (data.tagId) {
      infoItems.push({ label: "タグNo.", value: data.tagId });
    }

    // 代車情報を追加
    if (data.courtesyCar) {
      const courtesyCarText = data.courtesyCar.licensePlate
        ? `${data.courtesyCar.name} / ${data.courtesyCar.licensePlate}（貸出中）`
        : `${data.courtesyCar.name}（貸出中）`;
      infoItems.push({ label: "代車", value: courtesyCarText });
    }

    infoItems.forEach((item) => {
      // ページを超える場合は新しいページを作成
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin.top;
      }

      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text(`${item.label}:`, margin.left, yPosition);
      
      const labelText = `${item.label}:`;
      const labelWidth = doc.getTextWidth(labelText);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
      
      // 値が長い場合は複数行に分割
      const maxValueWidth = 210 - margin.left - margin.right - labelWidth - 5;
      const valueLines = doc.splitTextToSize(item.value || "", maxValueWidth);
      
      if (valueLines.length > 1) {
        doc.text(valueLines[0], margin.left + labelWidth + 3, yPosition);
        yPosition += 5;
        for (let i = 1; i < valueLines.length; i++) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = margin.top;
          }
          doc.text(valueLines[i], margin.left + labelWidth + 3, yPosition);
          yPosition += 5;
        }
      } else {
        doc.text(item.value || "", margin.left + labelWidth + 3, yPosition);
        yPosition += 7;
      }
    });

    yPosition += 5;

    // =============================================================================
    // 顧客からの申し送り事項
    // =============================================================================
    if (data.customerNotes) {
      // ページを超える場合は新しいページを作成
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin.top;
      }

      doc.setFontSize(fontSize.heading);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text("【顧客からの申し送り事項】", margin.left, yPosition);
      yPosition += 8;

      // 背景色付きボックス
      const boxHeight = Math.min(40, (data.customerNotes.length / 50) * 5 + 10);
      doc.setFillColor(255, 248, 220); // 薄い黄色
      doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
      
      doc.setFontSize(fontSize.normal);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
      
      // テキストを複数行に分割（幅に合わせて）
      const maxWidth = 210 - margin.left - margin.right - 4; // パディング分を引く
      const lines = doc.splitTextToSize(data.customerNotes, maxWidth);
      
      lines.forEach((line: string) => {
        // ページを超える場合は新しいページを作成
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin.top;
          // 新しいページにも背景色を追加
          doc.setFillColor(255, 248, 220);
          doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
        }
        doc.text(line, margin.left + 2, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    }

    // =============================================================================
    // 受付メモ（受付スタッフからの指示）
    // =============================================================================
    if (data.workOrder) {
      // ページを超える場合は新しいページを作成
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin.top;
      }

      doc.setFontSize(fontSize.heading);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text("【受付メモ】", margin.left, yPosition);
      yPosition += 8;

      // 背景色付きボックス（オレンジ系）
      const boxHeight = Math.min(40, (data.workOrder.length / 50) * 5 + 10);
      doc.setFillColor(255, 247, 237); // 薄いオレンジ
      doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
      
      doc.setFontSize(fontSize.normal);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
      
      // テキストを複数行に分割（幅に合わせて）
      const maxWidth = 210 - margin.left - margin.right - 4; // パディング分を引く
      const lines = doc.splitTextToSize(data.workOrder, maxWidth);
      
      lines.forEach((line: string, index: number) => {
        // ページを超える場合は新しいページを作成
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin.top;
          // 新しいページにも背景色を追加
          doc.setFillColor(255, 247, 237); // 薄いオレンジ
          doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
        }
        doc.text(line, margin.left + 2, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    }

    // =============================================================================
    // 承認済み作業内容（作業待ち以降のみ表示）
    // =============================================================================
    if (data.approvedWorkItems) {
      // ページを超える場合は新しいページを作成
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin.top;
      }

      doc.setFontSize(fontSize.heading);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text("【承認済み作業内容】", margin.left, yPosition);
      yPosition += 8;

      // 背景色付きボックス（青系）
      const boxHeight = Math.min(40, (data.approvedWorkItems.length / 50) * 5 + 10);
      doc.setFillColor(239, 246, 255); // 薄い青
      doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
      
      doc.setFontSize(fontSize.normal);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
      
      // テキストを複数行に分割（幅に合わせて）
      const maxWidth = 210 - margin.left - margin.right - 4; // パディング分を引く
      const lines = doc.splitTextToSize(data.approvedWorkItems, maxWidth);
      
      lines.forEach((line: string) => {
        // ページを超える場合は新しいページを作成
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin.top;
          // 新しいページにも背景色を追加
          doc.setFillColor(239, 246, 255); // 薄い青
          doc.rect(margin.left, yPosition - 2, 210 - margin.left - margin.right, boxHeight, "F");
        }
        doc.text(line, margin.left + 2, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    }

    // =============================================================================
    // 過去の作業履歴（関連情報）
    // =============================================================================
    if (data.historicalJobs && data.historicalJobs.length > 0) {
      // ページを超える場合は新しいページを作成
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin.top;
      }

      doc.setFontSize(fontSize.heading);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text("【過去の作業履歴】", margin.left, yPosition);
      yPosition += 8;

      doc.setFontSize(fontSize.normal);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }

      // 過去の作業履歴をリスト形式で表示
      data.historicalJobs.forEach((historyItem, index) => {
        // ページを超える場合は新しいページを作成
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin.top;
        }

        // 項目のテキストを生成
        const historyText = `・${historyItem.date}: ${historyItem.serviceKind} - ${historyItem.summary}`;
        
        // テキストを複数行に分割（幅に合わせて）
        const maxWidth = 210 - margin.left - margin.right - 4;
        const lines = doc.splitTextToSize(historyText, maxWidth);
        
        lines.forEach((line: string) => {
          // ページを超える場合は新しいページを作成
          if (yPosition > 270) {
            doc.addPage();
            yPosition = margin.top;
          }
          doc.text(line, margin.left + 2, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 8;
    }

    // =============================================================================
    // フッター（生成日時・ページ番号）
    // =============================================================================
    const generatedDate = new Date(data.generatedAt);
    const generatedDateStr = generatedDate.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });

    // 各ページの下部に生成日時とページ番号を表示
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // フッター区切り線
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin.left, 280, 210 - margin.right, 280);
      
      doc.setFontSize(fontSize.small);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.setTextColor(128, 128, 128);
      
      // 生成日時（左）
      doc.text(
        `生成日時: ${generatedDateStr}`,
        margin.left,
        287
      );
      
      // ページ番号（右）
      doc.text(
        `${i} / ${pageCount}`,
        210 - margin.right,
        287,
        { align: "right" }
      );
      
      // テキストカラーをリセット
      doc.setTextColor(0, 0, 0);
    }

    // PDFをBlobに変換
    const pdfBlob = doc.output("blob");

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
 *
 * @param job ジョブ情報
 * @returns 作業指示書PDFデータ
 */
export async function createWorkOrderPDFDataFromJob(job: {
  id: string;
  field4: { name: string; id?: string } | null;
  field6: { name: string } | null;
  field22: string | null;
  field?: string | null;
  field7?: string | null;
  field10?: number | null; // 走行距離
  field13?: string | null; // 承認済み作業内容
  serviceKind?: ServiceKind | null;
  field_service_kinds?: ServiceKind[] | null;
  assignedMechanic?: string | null;
  tagId?: string | null; // スマートタグID
  courtesyCar?: { // 代車情報
    name: string;
    licensePlate?: string;
  } | null;
}): Promise<WorkOrderPDFData | null> {
  if (!job.field4 || !job.field6) {
    return null;
  }

  // 車両情報から車名とナンバープレートを抽出
  const vehicleInfo = job.field6.name || "";
  const vehicleParts = vehicleInfo.split(" / ");
  const vehicleName = vehicleParts[0] || vehicleInfo;
  const licensePlate = vehicleParts[1] || "";

  // サービス種別を取得
  const serviceKind = job.field_service_kinds?.[0] || job.serviceKind || ("一般整備" as ServiceKind);

  // 顧客からの申し送り事項を抽出（field7から一時帰宅情報などを除く）
  let customerNotes = job.field7 || null;
  if (customerNotes) {
    // 一時帰宅情報セクションを削除
    customerNotes = customerNotes.replace(/【一時帰宅情報】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    // 車検チェックリスト情報セクションを削除
    customerNotes = customerNotes.replace(/【車検チェックリスト】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    // エラーランプ情報セクションを削除
    customerNotes = customerNotes.replace(/【エラーランプ情報】\s*\n[\s\S]*?(?=\n\n|$)/g, "").trim();
    // 空になった場合はnullに
    if (!customerNotes || customerNotes.length === 0) {
      customerNotes = null;
    }
  }

  // 過去の作業履歴を取得
  let historicalJobs: WorkOrderPDFData["historicalJobs"] = null;
  if (job.field4.id) {
    try {
      const historicalJobsResult = await fetchHistoricalJobsByCustomerId(job.field4.id, {
        statusFilter: "completed", // 完了した案件のみ
      });
      
      if (historicalJobsResult.success && historicalJobsResult.data) {
        // 現在のジョブを除外（自分自身は履歴に含めない）
        const filteredJobs = historicalJobsResult.data.filter((hJob) => hJob.id !== job.id);
        
        // 最新5件に制限
        const limitedJobs = filteredJobs.slice(0, 5);
        
        // WorkOrderPDFDataの形式に変換
        historicalJobs = limitedJobs.map((hJob) => {
          // サービス種別を取得（HistoricalJobには含まれていないため、ステータスから推測）
          const serviceKindText = hJob.status === "出庫済み" ? "整備完了" : hJob.status;
          
          // 日付をフォーマット
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
        
        // 空配列の場合はnullに
        if (historicalJobs.length === 0) {
          historicalJobs = null;
        }
      }
    } catch (error) {
      console.error("[PDF] 過去の作業履歴の取得に失敗:", error);
      // エラーが発生してもPDF生成は続行（過去の作業履歴なしで生成）
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
    workOrder: job.field || null, // 受付メモ（旧: 作業指示）
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







