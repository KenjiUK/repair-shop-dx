/**
 * Google OAuth認証ライブラリ
 * 
 * Service Account方式を使用してGoogle APIへのアクセストークンを取得
 * 
 * 実装方式:
 * 1. Service Account JSONファイルを使用（推奨、本番環境）
 * 2. 環境変数からアクセストークンを取得（開発用、フォールバック）
 * 
 * 環境変数:
 * - GOOGLE_SERVICE_ACCOUNT_JSON: Service Account JSONファイルの内容（JSON文字列）
 * - GOOGLE_DRIVE_ACCESS_TOKEN: アクセストークン（開発用、フォールバック）
 */

import { google } from "googleapis";

// =============================================================================
// 設定
// =============================================================================

/** Google API スコープ */
const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
] as const;

// =============================================================================
// Service Account認証
// =============================================================================

/**
 * Service Account認証を使用してアクセストークンを取得
 */
async function getAccessTokenFromServiceAccount(): Promise<string> {
  try {
    // 環境変数からService Account JSONを取得
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON が設定されていません");
    }

    // JSON文字列をパース
    const serviceAccount = JSON.parse(serviceAccountJson);

    // JWT認証クライアントを作成
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [...GOOGLE_API_SCOPES],
    });

    // アクセストークンを取得
    const tokenResponse = await auth.getAccessToken();
    
    if (!tokenResponse.token) {
      throw new Error("アクセストークンの取得に失敗しました");
    }

    return tokenResponse.token;
  } catch (error) {
    console.error("[Google Auth] Service Account認証エラー:", error);
    throw new Error(
      `Service Account認証に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
    );
  }
}

// =============================================================================
// フォールバック（環境変数から直接取得）
// =============================================================================

/**
 * 環境変数からアクセストークンを取得（開発用、フォールバック）
 */
function getAccessTokenFromEnv(): string {
  const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error(
      "GOOGLE_DRIVE_ACCESS_TOKEN が設定されていません。Service Account認証またはアクセストークンを設定してください。"
    );
  }

  return token;
}

// =============================================================================
// 公開API
// =============================================================================

/**
 * Google API アクセストークンを取得
 * 
 * 優先順位:
 * 1. Service Account認証（GOOGLE_SERVICE_ACCOUNT_JSONが設定されている場合）
 * 2. 環境変数から直接取得（GOOGLE_DRIVE_ACCESS_TOKEN、開発用）
 * 
 * @returns アクセストークン
 */
export async function getGoogleAccessToken(): Promise<string> {
  // Service Account JSONが設定されている場合はService Account認証を使用
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return await getAccessTokenFromServiceAccount();
    } catch (error) {
      console.warn("[Google Auth] Service Account認証に失敗、フォールバックを使用:", error);
      // フォールバック: 環境変数から直接取得
      return getAccessTokenFromEnv();
    }
  }

  // フォールバック: 環境変数から直接取得
  return getAccessTokenFromEnv();
}

/**
 * Google Drive API クライアントを取得（googleapisライブラリを使用）
 * 
 * @returns Google Drive API クライアント
 */
export async function getGoogleDriveClient() {
  try {
    // Service Account JSONが設定されている場合はService Account認証を使用
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      return google.drive({ version: "v3", auth });
    }

    // フォールバック: 環境変数からアクセストークンを取得
    const accessToken = getAccessTokenFromEnv();
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("[Google Auth] Drive クライアント作成エラー:", error);
    throw new Error(
      `Google Drive クライアントの作成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
    );
  }
}

/**
 * Google Sheets API クライアントを取得（googleapisライブラリを使用）
 * 
 * @returns Google Sheets API クライアント
 */
export async function getGoogleSheetsClient() {
  try {
    // Service Account JSONが設定されている場合はService Account認証を使用
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      return google.sheets({ version: "v4", auth });
    }

    // フォールバック: 環境変数からアクセストークンを取得
    const accessToken = getAccessTokenFromEnv();
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.sheets({ version: "v4", auth });
  } catch (error) {
    console.error("[Google Auth] Sheets クライアント作成エラー:", error);
    throw new Error(
      `Google Sheets クライアントの作成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
    );
  }
}




