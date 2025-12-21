/**
 * 重要な顧客フラグ管理
 * localStorageで顧客IDをキーにフラグを管理
 */

const STORAGE_KEY = "important-customers";

/**
 * 重要な顧客IDのリストを取得
 */
export function getImportantCustomerIds(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch (error) {
    console.error("重要な顧客フラグの読み込みエラー:", error);
    return [];
  }
}

/**
 * 顧客が重要な顧客かどうかを判定
 */
export function isImportantCustomer(customerId: string | null | undefined): boolean {
  if (!customerId) return false;
  const importantIds = getImportantCustomerIds();
  return importantIds.includes(customerId);
}

/**
 * 重要な顧客フラグをトグル（オン/オフ）
 */
export function toggleImportantCustomer(customerId: string | null | undefined): boolean {
  if (!customerId) return false;
  
  const importantIds = getImportantCustomerIds();
  const index = importantIds.indexOf(customerId);
  
  let newImportantIds: string[];
  let isNowImportant: boolean;
  
  if (index === -1) {
    // 追加
    newImportantIds = [...importantIds, customerId];
    isNowImportant = true;
  } else {
    // 削除
    newImportantIds = importantIds.filter((id) => id !== customerId);
    isNowImportant = false;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newImportantIds));
    return isNowImportant;
  } catch (error) {
    console.error("重要な顧客フラグの保存エラー:", error);
    return !isNowImportant; // エラー時は元の状態を返す
  }
}





