'use server'

import { createFolderStructure } from '@/lib/google-drive-server';
import { ZohoJob } from '@/types';

export async function createJobFolderAction(
    jobId: string,
    jobDate: string,
    workOrderId: string,
    customerId: string,
    customerName: string,
    vehicleId: string,
    vehicleName: string
) {
    try {
        console.log("[createJobFolderAction] フォルダ作成開始:", {
            jobId,
            jobDate,
            customerId,
            customerName,
            vehicleId,
            vehicleName,
        });

        const result = await createFolderStructure({
            customerId,
            customerName,
            vehicleId,
            vehicleName,
            jobId,
            jobDate,
            workOrderId,
        });

        console.log("[createJobFolderAction] フォルダ作成結果:", {
            customerFolderId: result.customerFolder.id,
            vehicleFolderId: result.vehicleFolder?.id,
            jobFolderId: result.jobFolder?.id,
            jobFolderWebViewLink: result.jobFolder?.webViewLink,
        });

        // Return the URL of the job folder or work order folder
        // Preferably the Job folder link, but maybe the workflow uses field19 which is likely the Job folder?
        // In CompactJobHeader, field19 is "お客様共有フォルダ" (Customer Shared Folder)
        // In google-drive.ts, it creates customer/vehicle/job/workOrder structure.

        // Usually field19 points to the specific Job folder.
        // webViewLinkが存在しない場合は、フォルダIDからURLを構築
        const getFolderUrl = (folder: { id: string; webViewLink?: string } | undefined): string | undefined => {
            if (!folder) return undefined;
            // webViewLinkが存在する場合はそれを使用
            if (folder.webViewLink) return folder.webViewLink;
            // webViewLinkが存在しない場合は、フォルダIDからURLを構築
            return `https://drive.google.com/drive/folders/${folder.id}`;
        };

        const jobFolderUrl = getFolderUrl(result.jobFolder);
        const customerFolderUrl = getFolderUrl(result.customerFolder);

        const finalUrl = jobFolderUrl ?? customerFolderUrl ?? undefined;

        console.log("[createJobFolderAction] 最終URL:", finalUrl);

        if (!finalUrl) {
            console.error("[createJobFolderAction] URLが生成されませんでした");
            return { success: false, error: "フォルダURLの生成に失敗しました" };
        }

        return {
            success: true,
            url: finalUrl
        };
    } catch (error) {
        console.error("[createJobFolderAction] フォルダ作成エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        console.error("[createJobFolderAction] エラー詳細:", {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return { success: false, error: `フォルダの作成に失敗しました: ${errorMessage}` };
    }
}
