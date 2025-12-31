import { CreateFolderOptions, DriveFolder, FolderPath } from "@/types";
import { getGoogleAccessToken } from "@/lib/google-auth";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

/**
 * フォルダを作成 (Server-side)
 */
export async function createFolderInDrive(
    folderName: string,
    parentFolderId?: string,
    driveId?: string
): Promise<DriveFolder> {
    try {
        const accessToken = await getGoogleAccessToken();

        // フォルダメタデータを作成
        const metadata: any = {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
        };
        
        // 共有ドライブの場合
        if (driveId) {
            metadata.driveId = driveId;
            // 共有ドライブのルートに作成する場合、parentsに共有ドライブIDを含める
            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }
        } else if (parentFolderId) {
            // 個人ドライブの場合
            metadata.parents = [parentFolderId];
        }

        // 共有ドライブ対応のためのパラメータ
        const supportsAllDrives = true;
        const includeItemsFromAllDrives = true;
        
        const url = `${GOOGLE_DRIVE_API_BASE}/files?fields=id,name,createdTime,modifiedTime,webViewLink,parents,driveId&supportsAllDrives=${supportsAllDrives}&includeItemsFromAllDrives=${includeItemsFromAllDrives}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(metadata),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "エラーレスポンスの読み取りに失敗");
            let errorData: any = {};
            try {
                errorData = JSON.parse(errorText);
            } catch {
                // JSONパース失敗時はそのまま使用
            }
            console.error("[createFolderInDrive] APIエラー:", {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText.substring(0, 500),
                errorData,
            });
            throw new Error(
                errorData.error?.message || `フォルダの作成に失敗しました: ${response.status} ${response.statusText}`
            );
        }

        const file = await response.json();
        // webViewLinkが存在しない場合は、フォルダIDからURLを構築
        // Service Accountで作成されたフォルダの場合、webViewLinkがnullの可能性がある
        const webViewLink = file.webViewLink || `https://drive.google.com/drive/folders/${file.id}`;

        // driveIdを取得（APIレスポンスから取得、または引数として渡されたdriveIdを使用）
        const folderDriveId = file.driveId || driveId || undefined;

        const folder: DriveFolder = {
            id: file.id,
            name: file.name,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: webViewLink,
            parentId: file.parents?.[0],
            driveId: folderDriveId,
        };

        // 共有ドライブ内に作成したフォルダの場合、ユーザーアカウントに権限を付与
        if (driveId && process.env.GOOGLE_DRIVE_USER_EMAIL) {
            try {
                await grantFolderPermission(folder.id, process.env.GOOGLE_DRIVE_USER_EMAIL, "writer");
            } catch (permissionError) {
                // 権限付与に失敗してもフォルダは作成されているため、警告のみ
                console.warn("[createFolderInDrive] 権限付与に失敗しました（フォルダは作成されています）:", permissionError);
            }
        }

        return folder;
    } catch (error) {
        console.error("[createFolderInDrive] エラー:", error);
        throw error;
    }
}

/**
 * フォルダに権限を付与 (Server-side)
 */
async function grantFolderPermission(
    folderId: string,
    userEmail: string,
    role: "reader" | "writer" | "commenter" = "writer"
): Promise<void> {
    try {
        const accessToken = await getGoogleAccessToken();

        const permissionData = {
            type: "user",
            role: role,
            emailAddress: userEmail,
        };

        const url = `${GOOGLE_DRIVE_API_BASE}/files/${folderId}/permissions?supportsAllDrives=true&fields=id,role`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(permissionData),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "エラーレスポンスの読み取りに失敗");
            let errorData: any = {};
            try {
                errorData = JSON.parse(errorText);
            } catch {
                // JSONパース失敗時はそのまま使用
            }
            console.error("[grantFolderPermission] APIエラー:", {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText.substring(0, 500),
                errorData,
            });
            throw new Error(
                errorData.error?.message || `権限の付与に失敗しました: ${response.status} ${response.statusText}`
            );
        }

        await response.json();
    } catch (error) {
        console.error("[grantFolderPermission] エラー:", error);
        throw error;
    }
}

/**
 * 既存のフォルダを検索 (Server-side)
 */
export async function findExistingFolder(
    folderName: string,
    parentFolderId?: string,
    driveId?: string
): Promise<DriveFolder | null> {
    try {
        const accessToken = await getGoogleAccessToken();

        let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        if (parentFolderId && parentFolderId !== driveId) {
            query += ` and '${parentFolderId}' in parents`;
        }

        // 共有ドライブ対応のためのパラメータ
        const supportsAllDrives = true;
        const includeItemsFromAllDrives = true;
        
        let url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,modifiedTime,webViewLink,parents,driveId)&supportsAllDrives=${supportsAllDrives}&includeItemsFromAllDrives=${includeItemsFromAllDrives}`;
        
        // 共有ドライブ内で検索する場合
        if (driveId) {
            url += `&driveId=${driveId}&corpora=drive`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "エラーレスポンスの読み取りに失敗");
            console.warn("[findExistingFolder] APIエラー（既存フォルダが見つからない可能性）:", {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText.substring(0, 500),
            });
            return null;
        }

        const data = await response.json();
        const files = data.files || [];

        if (files.length === 0) {
            return null;
        }

        // 最初に見つかったフォルダを返す
        const folder = files[0];
        // webViewLinkが存在しない場合は、フォルダIDからURLを構築
        // Service Accountで作成されたフォルダの場合、webViewLinkがnullの可能性がある
        const webViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;

        // driveIdを取得（APIレスポンスから取得、または引数として渡されたdriveIdを使用）
        const folderDriveId = folder.driveId || driveId || undefined;

        return {
            id: folder.id,
            name: folder.name,
            createdTime: folder.createdTime,
            modifiedTime: folder.modifiedTime,
            webViewLink: webViewLink,
            parentId: folder.parents?.[0],
            driveId: folderDriveId,
        };
    } catch (error) {
        console.error("[findExistingFolder] エラー:", error);
        return null;
    }
}

/**
 * フォルダを取得または作成 (Server-side)
 */
export async function getOrCreateFolder(
    options: CreateFolderOptions
): Promise<DriveFolder> {
    // 既存フォルダを検索
    const existing = await findExistingFolder(
        options.folderName,
        options.parentFolderId,
        options.driveId
    );

    if (existing) {
        return existing;
    }

    // フォルダが存在しない場合は作成
    return createFolderInDrive(options.folderName, options.parentFolderId, options.driveId);
}

/**
 * フォルダ構造を生成 (Server-side)
 */
export async function createFolderStructure(
    path: FolderPath
): Promise<{
    customerFolder: DriveFolder;
    vehicleFolder?: DriveFolder;
    jobFolder?: DriveFolder;
    workOrderFolder?: DriveFolder;
}> {
    try {
        // 1. Root Folder (共有ドライブまたは個人ドライブ)
        const sharedDriveId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
        
        let rootFolder: DriveFolder;
        let driveId: string | undefined;
        
        if (sharedDriveId) {
            // 共有ドライブが指定されている場合、driveIdとして使用
            driveId = sharedDriveId;
            // 共有ドライブ内にrootFolderを作成（共有ドライブのルートに作成）
            const rootParams = { 
                folderName: "repair-shop-dx", 
                parentFolderId: sharedDriveId, // 共有ドライブIDをparentFolderIdとして使用
                driveId: driveId,
                returnExisting: true 
            };
            rootFolder = await getOrCreateFolder(rootParams);
        } else {
            // 共有ドライブが指定されていない場合、個人ドライブに作成
            const rootParams = { folderName: "repair-shop-dx", returnExisting: true };
            rootFolder = await getOrCreateFolder(rootParams);
        }

        // 2. Customer Folder
        const customerFolderName = `${path.customerName}_${path.customerId}`;
        const customersDir = await getOrCreateFolder({
            folderName: "customers",
            parentFolderId: rootFolder.id,
            driveId: driveId,
            returnExisting: true
        });

        const customerFolder = await getOrCreateFolder({
            folderName: customerFolderName,
            parentFolderId: customersDir.id,
            driveId: driveId,
            returnExisting: true
        });

        const result: any = { customerFolder };

        if (path.vehicleId && path.vehicleName) {
            // 3. Vehicle Folder
            const vehicleFolderName = `${path.vehicleName}_${path.vehicleId}`;
            const vehiclesDir = await getOrCreateFolder({
                folderName: "vehicles",
                parentFolderId: customerFolder.id,
                driveId: driveId,
                returnExisting: true
            });

            const vehicleFolder = await getOrCreateFolder({
                folderName: vehicleFolderName,
                parentFolderId: vehiclesDir.id,
                driveId: driveId,
                returnExisting: true
            });

            result.vehicleFolder = vehicleFolder;

            // Documents folder (implied) - skipping to save time/complexity if not strictly needed now, but good to have.
            // let's stick to the structure in google-drive.ts

            if (path.jobId && path.jobDate) {
                // 4. Job Folder
                const jobFolderName = `${path.jobDate}_${path.jobId}`;
                const jobsDir = await getOrCreateFolder({
                    folderName: "jobs",
                    parentFolderId: vehicleFolder.id,
                    driveId: driveId,
                    returnExisting: true
                });

                const jobFolder = await getOrCreateFolder({
                    folderName: jobFolderName,
                    parentFolderId: jobsDir.id,
                    driveId: driveId,
                    returnExisting: true
                });

                result.jobFolder = jobFolder;

                if (path.workOrderId) {
                    // 5. Work Order Folder
                    const woFolderName = `wo-${path.workOrderId}`;
                    const workOrderFolder = await getOrCreateFolder({
                        folderName: woFolderName,
                        parentFolderId: jobFolder.id,
                        driveId: driveId,
                        returnExisting: true
                    });
                    result.workOrderFolder = workOrderFolder;
                }
            }
        }

        return result;
    } catch (error) {
        console.error("[createFolderStructure] エラー:", error);
        throw error;
    }
}
