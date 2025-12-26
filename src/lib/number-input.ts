/**
 * 数値入力ユーティリティ
 * 
 * IME対応: 全角数字を半角数字に変換
 */

/**
 * 全角数字を半角数字に変換
 * 
 * @param value 入力値（全角・半角混合可）
 * @returns 半角数字に変換された文字列
 */
export function convertFullWidthToHalfWidth(value: string): string {
  // 全角数字（０-９）を半角数字（0-9）に変換
  return value.replace(/[０-９]/g, (char) => {
    const fullWidthMap: Record<string, string> = {
      "０": "0",
      "１": "1",
      "２": "2",
      "３": "3",
      "４": "4",
      "５": "5",
      "６": "6",
      "７": "7",
      "８": "8",
      "９": "9",
    };
    return fullWidthMap[char] || char;
  });
}

/**
 * 数値文字列をクリーンアップ（全角→半角変換、カンマ・空白除去）
 * 
 * @param value 入力値
 * @returns クリーンアップされた文字列（数値のみ）
 */
export function cleanNumericInput(value: string): string {
  // 全角数字を半角数字に変換
  let cleaned = convertFullWidthToHalfWidth(value);
  
  // カンマ、空白、その他の記号を除去（小数点とマイナス記号は保持）
  cleaned = cleaned.replace(/[^\d.-]/g, "");
  
  return cleaned;
}

/**
 * 数値文字列を数値に変換（NaNの場合はnullを返す）
 * 
 * @param value 入力値
 * @returns 数値（変換できない場合はnull）
 */
export function parseNumericValue(value: string): number | null {
  const cleaned = cleanNumericInput(value);
  
  // 空文字列の場合はnullを返す
  if (!cleaned.trim()) {
    return null;
  }
  
  // 数値に変換
  const num = parseFloat(cleaned);
  
  // NaNの場合はnullを返す
  if (isNaN(num)) {
    return null;
  }
  
  return num;
}

/**
 * 数値入力のバリデーション
 * 
 * @param value 入力値
 * @param options バリデーションオプション
 * @returns バリデーション結果
 */
export function validateNumericInput(
  value: string,
  options: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    allowDecimal?: boolean;
  } = {}
): {
  isValid: boolean;
  error?: string;
  parsedValue?: number | null;
} {
  const { min, max, allowNegative = false, allowDecimal = true } = options;
  
  // 空文字列は有効（未入力状態）
  if (!value.trim()) {
    return { isValid: true, parsedValue: null };
  }
  
  // 全角→半角変換とクリーンアップ
  const cleaned = cleanNumericInput(value);
  
  // 数値に変換
  const parsed = parseNumericValue(cleaned);
  
  // 変換できない場合はエラー
  if (parsed === null) {
    return {
      isValid: false,
      error: "数値を入力してください",
      parsedValue: null,
    };
  }
  
  // 負の数のチェック
  if (!allowNegative && parsed < 0) {
    return {
      isValid: false,
      error: "負の数は入力できません",
      parsedValue: parsed,
    };
  }
  
  // 小数点のチェック
  if (!allowDecimal && !Number.isInteger(parsed)) {
    return {
      isValid: false,
      error: "整数を入力してください",
      parsedValue: parsed,
    };
  }
  
  // 最小値チェック
  if (min !== undefined && parsed < min) {
    return {
      isValid: false,
      error: `${min}以上の値を入力してください`,
      parsedValue: parsed,
    };
  }
  
  // 最大値チェック
  if (max !== undefined && parsed > max) {
    return {
      isValid: false,
      error: `${max}以下の値を入力してください`,
      parsedValue: parsed,
    };
  }
  
  return {
    isValid: true,
    parsedValue: parsed,
  };
}

