/**
 * ファイルアップロードバリデーション
 *
 * 拡張子、MIMEタイプ、サイズの検証
 */

// =============================================================================
// ファイルタイプ定義
// =============================================================================

/**
 * 許可されたファイルタイプ
 */
export const ALLOWED_FILE_TYPES = {
  /** 画像ファイル */
  image: {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    mimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  /** 動画ファイル */
  video: {
    extensions: [".mp4", ".mov", ".avi", ".webm"],
    mimeTypes: [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  /** PDFファイル */
  pdf: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  /** 音声ファイル */
  audio: {
    extensions: [".mp3", ".wav", ".m4a", ".ogg"],
    mimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/x-m4a",
      "audio/ogg",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

/**
 * ファイルタイプ
 */
export type FileType = keyof typeof ALLOWED_FILE_TYPES;

// =============================================================================
// バリデーション結果
// =============================================================================

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** バリデーション成功かどうか */
  valid: boolean;
  /** エラーメッセージ */
  error?: string;
}

// =============================================================================
// バリデーション関数
// =============================================================================

/**
 * ファイル拡張子を取得
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : "";
}

/**
 * ファイルタイプを判定
 */
export function detectFileType(file: File): FileType | null {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;

  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES) as Array<[FileType, { extensions: readonly string[]; mimeTypes: readonly string[]; maxSize: number }]>) {
    if (
      config.extensions.includes(extension) ||
      config.mimeTypes.includes(mimeType)
    ) {
      return type;
    }
  }

  return null;
}

/**
 * ファイルサイズを検証
 */
export function validateFileSize(
  file: File,
  maxSize: number
): ValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます（最大: ${maxSizeMB}MB、現在: ${fileSizeMB}MB）`,
    };
  }

  return { valid: true };
}

/**
 * ファイル拡張子を検証
 */
export function validateFileExtension(
  fileName: string,
  allowedExtensions: readonly string[]
): ValidationResult {
  const extension = getFileExtension(fileName);

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `許可されていないファイル形式です（許可: ${allowedExtensions.join(", ")}）`,
    };
  }

  return { valid: true };
}

/**
 * ファイルMIMEタイプを検証
 */
export function validateMimeType(
  mimeType: string,
  allowedMimeTypes: readonly string[]
): ValidationResult {
  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `許可されていないMIMEタイプです（許可: ${allowedMimeTypes.join(", ")}）`,
    };
  }

  return { valid: true };
}

/**
 * ファイルを総合的に検証
 */
export function validateFile(
  file: File,
  allowedTypes: FileType[] = ["image", "video", "pdf", "audio"]
): ValidationResult {
  // ファイルタイプを判定
  const fileType = detectFileType(file);
  if (!fileType) {
    return {
      valid: false,
      error: "サポートされていないファイル形式です",
    };
  }

  // 許可されたタイプかチェック
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `許可されていないファイルタイプです（許可: ${allowedTypes.join(", ")}）`,
    };
  }

  const typeConfig = ALLOWED_FILE_TYPES[fileType];

  // 拡張子を検証
  const extensionResult = validateFileExtension(file.name, typeConfig.extensions);
  if (!extensionResult.valid) {
    return extensionResult;
  }

  // MIMEタイプを検証
  const mimeTypeResult = validateMimeType(file.type, typeConfig.mimeTypes);
  if (!mimeTypeResult.valid) {
    return mimeTypeResult;
  }

  // ファイルサイズを検証
  const sizeResult = validateFileSize(file, typeConfig.maxSize);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}

/**
 * 複数ファイルを検証
 */
export function validateFiles(
  files: File[],
  allowedTypes: FileType[] = ["image", "video", "pdf", "audio"]
): {
  valid: boolean;
  errors: Array<{ file: File; error: string }>;
  validFiles: File[];
} {
  const errors: Array<{ file: File; error: string }> = [];
  const validFiles: File[] = [];

  for (const file of files) {
    const result = validateFile(file, allowedTypes);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push({ file, error: result.error || "バリデーションエラー" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  };
}

// =============================================================================
// ファイルサイズのフォーマット
// =============================================================================

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
























