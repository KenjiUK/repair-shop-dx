/**
 * コーティング事前見積データの保存・読み込み機能
 * 
 * Google DriveのJobフォルダに`pre-estimate.json`として保存
 */

import { PreEstimateData } from "@/types";
import {
  getOrCreateJobFolder,
  uploadFile,
  searchFiles,
  getFileById,
} from "./google-drive";

/**
 * 事前見積データを保存
 * 
 * @param jobId Job ID
 * @param data 事前見積データ
 * @param job Jobデータ（顧客・車両情報を取得するため）
 * @returns 保存されたファイル情報
 */
export async function savePreEstimateData(
  jobId: string,
  data: PreEstimateData,
  job: {
    field4?: { name?: string; id?: string } | null;
    field6?: { name?: string; id?: string } | null;
    field22?: string; // 入庫日時
  }
): Promise<void> {
  try {
    // 顧客情報を取得
    const customerId = job.field4?.id || "";
    const customerName = job.field4?.name || "顧客";
    
    // 車両情報を取得
    const vehicleId = job.field6?.id || "";
    const vehicleName = job.field6?.name ? (() => {
      const parts = job.field6.name.split(" / ");
      return parts[0] || job.field6.name;
    })() : "車両";
    
    // 入庫日時からJob日付を取得（YYYYMMDD形式）
    const jobDate = job.field22
      ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    // Jobフォルダを取得または作成
    const jobFolder = await getOrCreateJobFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate
    );
    
    // 既存のpre-estimate.jsonを検索
    const existingFiles = await searchFiles({
      query: "name='pre-estimate.json'",
      parentFolderId: jobFolder.id,
      mimeType: "application/json",
      maxResults: 1,
    });
    
    // JSONデータを文字列に変換
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    
    if (existingFiles.length > 0) {
      // 既存ファイルを更新
      const existingFile = existingFiles[0];
      await uploadFile({
        fileName: "pre-estimate.json",
        mimeType: "application/json",
        fileData: blob,
        parentFolderId: jobFolder.id,
        replaceExisting: true,
      });
    } else {
      // 新規ファイルを作成
      await uploadFile({
        fileName: "pre-estimate.json",
        mimeType: "application/json",
        fileData: blob,
        parentFolderId: jobFolder.id,
      });
    }
  } catch (error) {
    console.error("[Pre-Estimate Storage] 保存エラー:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "事前見積データの保存に失敗しました"
    );
  }
}

/**
 * 事前見積データを読み込み
 * 
 * @param jobId Job ID
 * @param job Jobデータ（顧客・車両情報を取得するため）
 * @returns 事前見積データ（存在しない場合はnull）
 */
export async function loadPreEstimateData(
  jobId: string,
  job: {
    field4?: { name?: string; id?: string } | null;
    field6?: { name?: string; id?: string } | null;
    field22?: string; // 入庫日時
  }
): Promise<PreEstimateData | null> {
  try {
    // 顧客情報を取得
    const customerId = job.field4?.id || "";
    const customerName = job.field4?.name || "顧客";
    
    // 車両情報を取得
    const vehicleId = job.field6?.id || "";
    const vehicleName = job.field6?.name ? (() => {
      const parts = job.field6.name.split(" / ");
      return parts[0] || job.field6.name;
    })() : "車両";
    
    // 入庫日時からJob日付を取得（YYYYMMDD形式）
    const jobDate = job.field22
      ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    // Jobフォルダを取得または作成
    const jobFolder = await getOrCreateJobFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate
    );
    
    // pre-estimate.jsonを検索
    const files = await searchFiles({
      query: "name='pre-estimate.json'",
      parentFolderId: jobFolder.id,
      mimeType: "application/json",
      maxResults: 1,
    });
    
    if (files.length === 0) {
      return null;
    }
    
    // ファイル内容を取得
    const file = files[0];
    const response = await fetch(`/api/google-drive/files/${file.id}/content`);
    
    if (!response.ok) {
      console.error("[Pre-Estimate Storage] ファイル内容取得エラー:", response.statusText);
      return null;
    }
    
    const result = await response.json();
    if (!result.success || !result.data) {
      console.error("[Pre-Estimate Storage] ファイル内容取得エラー:", result.error);
      return null;
    }
    
    // JSONをパース
    const data = JSON.parse(result.data.content) as PreEstimateData;
    return data;
  } catch (error) {
    console.error("[Pre-Estimate Storage] 読み込みエラー:", error);
    return null;
  }
}





