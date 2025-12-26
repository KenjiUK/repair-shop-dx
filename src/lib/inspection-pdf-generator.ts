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
      compress: false, // 日本語フォントの互換性のため圧縮を無効化
    });

    // 日本語フォントを読み込む
    const fontLoaded = await loadJapaneseFont(doc);
    
    // フォントが読み込まれなかった場合の警告
    if (!fontLoaded) {
      console.warn("[PDF] 日本語フォントが読み込めませんでした。文字化けが発生する可能性があります。");
    }

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
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "bold");
    } else {
      doc.setFont("helvetica", "bold");
    }
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
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "bold");
    } else {
      doc.setFont("helvetica", "bold");
    }
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
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "bold");
      } else {
        doc.setFont("helvetica", "bold");
      }
      doc.text("交換部品", margin.left, yPosition);
      yPosition += 7;

      doc.setFontSize(fontSize.normal);
      if (fontLoaded) {
        doc.setFont("NotoSansJP", "normal");
      } else {
        doc.setFont("helvetica", "normal");
      }

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
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "bold");
    } else {
      doc.setFont("helvetica", "bold");
    }
    doc.text("整備情報", margin.left, yPosition);
    yPosition += 7;

    doc.setFontSize(fontSize.normal);
    if (fontLoaded) {
      doc.setFont("NotoSansJP", "normal");
    } else {
      doc.setFont("helvetica", "normal");
    }
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























