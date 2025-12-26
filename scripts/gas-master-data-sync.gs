/**
 * マスタデータ同期GAS
 * 
 * 基幹システム（スマートカーディーラー）から出力されたCSV/Excelファイルを
 * Google Sheetsに自動変換するスクリプト
 * 
 * 処理フロー:
 * 1. Google Driveの所定フォルダを監視
 * 2. CSV/Excelファイルを検知
 * 3. ファイル形式を検証
 * 4. CSV/Excel → Google Sheetsに変換
 * 5. エラー発生時はGmail通知とログ記録
 */

// =============================================================================
// 設定値（環境に合わせて変更してください）
// =============================================================================

/** Google DriveフォルダID（/repair-shop-dx/master-data/のフォルダID） */
const MASTER_DATA_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

/** マスタデータスプレッドシートID */
const MASTER_DATA_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

/** シート名 */
const SHEET_NAMES = {
  VEHICLE: '車両マスタ',
  CUSTOMER: '顧客マスタ'
};

/** エラー通知先メールアドレス */
const ERROR_NOTIFICATION_EMAIL = 'admin@example.com';

/** エラーログシート名 */
const ERROR_LOG_SHEET_NAME = 'エラーログ';

// =============================================================================
// ファイル名パターン
// =============================================================================

/** ファイル名パターン（正規表現） */
const FILE_PATTERNS = {
  VEHICLE: /^車両マスタ_.*\.(csv|xlsx|xls)$/i,
  CUSTOMER: /^顧客マスタ_.*\.(csv|xlsx|xls)$/i
};

// =============================================================================
// メイン処理
// =============================================================================

/**
 * onChangeイベントハンドラ（推奨）
 * Google Driveフォルダの変更を検知
 */
function onChange(e) {
  try {
    // 変更されたファイルを取得
    const changedFiles = e.changedFiles || [];
    
    for (let i = 0; i < changedFiles.length; i++) {
      const file = changedFiles[i];
      
      // マスタデータフォルダ内のファイルか確認
      if (isInMasterDataFolder(file.id)) {
        processFile(file.id);
      }
    }
  } catch (error) {
    logError('onChange', null, error);
    sendErrorNotification('onChange', null, error);
  }
}

/**
 * Time-drivenトリガー用（フォールバック）
 * 5分ごとにフォルダをチェック
 */
function checkMasterDataFolder() {
  try {
    const folder = DriveApp.getFolderById(MASTER_DATA_FOLDER_ID);
    const files = folder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      
      // ファイル名パターンに一致するか確認
      if (FILE_PATTERNS.VEHICLE.test(fileName) || FILE_PATTERNS.CUSTOMER.test(fileName)) {
        // 処理済みファイルはスキップ（ファイル名に「_processed」を追加するなど）
        if (!fileName.includes('_processed')) {
          processFile(file.getId());
        }
      }
    }
  } catch (error) {
    logError('checkMasterDataFolder', null, error);
    sendErrorNotification('checkMasterDataFolder', null, error);
  }
}

// =============================================================================
// ファイル処理
// =============================================================================

/**
 * ファイルを処理
 */
function processFile(fileId) {
  let file = null;
  let fileName = '';
  
  try {
    file = DriveApp.getFileById(fileId);
    fileName = file.getName();
    
    // ファイル形式を判定
    const fileType = detectFileType(fileName);
    if (!fileType) {
      throw new Error(`サポートされていないファイル形式: ${fileName}`);
    }
    
    // マスタタイプを判定（車両マスタ or 顧客マスタ）
    const masterType = detectMasterType(fileName);
    if (!masterType) {
      throw new Error(`ファイル名からマスタタイプを判定できません: ${fileName}`);
    }
    
    // CSV/Excelを読み込み
    let data = null;
    if (fileType === 'csv') {
      data = readCSVFile(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      data = readExcelFile(file);
    }
    
    if (!data || data.length === 0) {
      throw new Error(`ファイルが空です: ${fileName}`);
    }
    
    // Google Sheetsに書き込み
    writeToSheet(masterType, data);
    
    // 処理済みファイルにリネーム（重複処理を防ぐ）
    file.setName(fileName + '_processed_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss'));
    
    // 成功ログ
    logSuccess(fileName, masterType, data.length);
    
  } catch (error) {
    logError('processFile', fileName, error);
    sendErrorNotification('processFile', fileName, error);
  }
}

// =============================================================================
// ファイル形式検出
// =============================================================================

/**
 * ファイル形式を検出
 */
function detectFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (extension === 'csv') {
    return 'csv';
  } else if (extension === 'xlsx') {
    return 'xlsx';
  } else if (extension === 'xls') {
    return 'xls';
  }
  
  return null;
}

/**
 * マスタタイプを検出
 */
function detectMasterType(fileName) {
  if (FILE_PATTERNS.VEHICLE.test(fileName)) {
    return 'VEHICLE';
  } else if (FILE_PATTERNS.CUSTOMER.test(fileName)) {
    return 'CUSTOMER';
  }
  
  return null;
}

/**
 * マスタデータフォルダ内のファイルか確認
 */
function isInMasterDataFolder(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const parents = file.getParents();
    
    while (parents.hasNext()) {
      const parent = parents.next();
      if (parent.getId() === MASTER_DATA_FOLDER_ID) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// =============================================================================
// CSV/Excel読み込み
// =============================================================================

/**
 * CSVファイルを読み込み
 */
function readCSVFile(file) {
  const blob = file.getBlob();
  const bytes = blob.getBytes();
  
  // UTF-8として読み込みを試行
  let content = '';
  try {
    content = Utilities.newBlob(bytes).getDataAsString('UTF-8');
    
    // 文字化けチェック（BOMがある場合はUTF-8確定）
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      // UTF-8 BOMあり
      content = content.substring(1); // BOMを除去
    } else {
      // 文字化けしている可能性がある場合はShift-JISとして試行
      if (hasGarbledCharacters(content)) {
        try {
          content = Utilities.newBlob(bytes).getDataAsString('Shift-JIS');
        } catch (e) {
          // Shift-JIS変換失敗時はUTF-8のまま使用
          Logger.log('Shift-JIS変換に失敗しました。UTF-8として処理します。');
        }
      }
    }
  } catch (e) {
    // UTF-8読み込み失敗時はShift-JISとして試行
    try {
      content = Utilities.newBlob(bytes).getDataAsString('Shift-JIS');
    } catch (e2) {
      throw new Error('CSVファイルの読み込みに失敗しました: ' + e2.message);
    }
  }
  
  // CSVをパース
  return parseCSV(content);
}

/**
 * 文字化けをチェック（簡易実装）
 */
function hasGarbledCharacters(text) {
  // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  
  // 文字化けの可能性がある文字（など）が含まれているかチェック
  const garbledPattern = /[\uFFFD]/;
  
  // 日本語が含まれているのに文字化け文字も含まれている場合は文字化けの可能性
  if (japanesePattern.test(text) && garbledPattern.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Excelファイルを読み込み
 */
function readExcelFile(file) {
  // Google Apps Scriptでは直接Excelファイルを読み込めないため、
  // Google Sheets APIを使用するか、CSVに変換する必要があります
  // ここでは簡易実装として、ファイルをGoogle Sheetsにインポートしてから読み込む方法を使用
  
  try {
    // 一時的なスプレッドシートを作成
    const tempSpreadsheet = SpreadsheetApp.create('temp_' + file.getName());
    const tempSheet = tempSpreadsheet.getActiveSheet();
    
    // Excelファイルをインポート（Google Drive APIを使用）
    // 注意: この方法は制限があるため、実際の実装ではGoogle Sheets APIの使用を推奨
    
    // 簡易実装: ファイルをGoogle Sheets形式に変換
    const blob = file.getBlob();
    const convertedFile = Drive.Files.insert(
      {
        title: 'temp_' + file.getName(),
        mimeType: MimeType.GOOGLE_SHEETS
      },
      blob,
      {
        convert: true
      }
    );
    
    // 変換されたスプレッドシートからデータを読み込み
    const convertedSpreadsheet = SpreadsheetApp.openById(convertedFile.id);
    const convertedSheet = convertedSpreadsheet.getSheets()[0];
    const data = convertedSheet.getDataRange().getValues();
    
    // 一時ファイルを削除
    DriveApp.getFileById(convertedFile.id).setTrashed(true);
    tempSpreadsheet.setTrashed(true);
    
    return data;
    
  } catch (error) {
    throw new Error(`Excelファイルの読み込みに失敗しました: ${error.message}`);
  }
}

/**
 * CSVをパース（ダブルクォート、改行を含むセルに対応）
 */
function parseCSV(csvContent) {
  const data = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        currentCell += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // セルの終了
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // 行の終了
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(function(cell) { return cell.length > 0; })) {
          data.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
      // \r\nの場合は次の文字をスキップ
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }
  
  // 最後の行を追加
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(function(cell) { return cell.length > 0; })) {
      data.push(currentRow);
    }
  }
  
  return data;
}


// =============================================================================
// Google Sheets書き込み
// =============================================================================

/**
 * Google Sheetsに書き込み
 */
function writeToSheet(masterType, data) {
  const spreadsheet = SpreadsheetApp.openById(MASTER_DATA_SPREADSHEET_ID);
  const sheetName = masterType === 'VEHICLE' ? SHEET_NAMES.VEHICLE : SHEET_NAMES.CUSTOMER;
  
  // シートを取得または作成
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // 既存データをクリア
  sheet.clear();
  
  // データを書き込み
  if (data.length > 0) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    
    // ヘッダー行をフォーマット（1行目を太字、背景色を設定）
    const headerRange = sheet.getRange(1, 1, 1, data[0].length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285F4');
    headerRange.setFontColor('#FFFFFF');
  }
}

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * エラーログを記録
 */
function logError(functionName, fileName, error) {
  try {
    const spreadsheet = SpreadsheetApp.openById(MASTER_DATA_SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet(ERROR_LOG_SHEET_NAME);
      // ヘッダー行を設定
      logSheet.getRange(1, 1, 1, 5).setValues([['日時', '関数名', 'ファイル名', 'エラー内容', 'ステータス']]);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const errorMessage = error.message || String(error);
    const stackTrace = error.stack || '';
    
    logSheet.appendRow([
      now,
      functionName || '',
      fileName || '',
      errorMessage + (stackTrace ? '\n' + stackTrace : ''),
      '失敗'
    ]);
  } catch (logError) {
    // ログ記録自体が失敗した場合はコンソールに出力
    Logger.log('ログ記録エラー: ' + logError.message);
  }
}

/**
 * 成功ログを記録
 */
function logSuccess(fileName, masterType, rowCount) {
  try {
    const spreadsheet = SpreadsheetApp.openById(MASTER_DATA_SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet(ERROR_LOG_SHEET_NAME);
      // ヘッダー行を設定
      logSheet.getRange(1, 1, 1, 5).setValues([['日時', '関数名', 'ファイル名', 'エラー内容', 'ステータス']]);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    logSheet.appendRow([
      now,
      'processFile',
      fileName,
      `${masterType}マスタ: ${rowCount}行を処理しました`,
      '成功'
    ]);
  } catch (logError) {
    // ログ記録自体が失敗した場合はコンソールに出力
    Logger.log('ログ記録エラー: ' + logError.message);
  }
}

/**
 * エラー通知を送信
 */
function sendErrorNotification(functionName, fileName, error) {
  try {
    const subject = '[マスタデータ同期GAS] エラー発生';
    const body = `
マスタデータ同期処理でエラーが発生しました。

【発生日時】
${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')}

【関数名】
${functionName || '不明'}

【ファイル名】
${fileName || '不明'}

【エラー内容】
${error.message || String(error)}

【スタックトレース】
${error.stack || 'なし'}
    `.trim();
    
    MailApp.sendEmail({
      to: ERROR_NOTIFICATION_EMAIL,
      subject: subject,
      body: body
    });
  } catch (emailError) {
    // メール送信失敗時はコンソールに出力
    Logger.log('メール送信エラー: ' + emailError.message);
  }
}

























