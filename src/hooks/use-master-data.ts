/**
 * マスタデータ取得用SWRフック
 * 
 * Google Sheetsからマスタデータを取得し、SWRでキャッシュ管理
 * TTL: 1時間、再検証: フォーカス時または5分ごと
 * 
 * ⚠️ 重要制約: 読み取り専用。追加・編集・削除は絶対にしない。
 */

import useSWR from "swr";
import {
  fetchVehicleMaster,
  fetchCustomerMaster,
  findVehicleMasterById,
  findCustomerMasterById,
  getVehicleMasterKey,
  getCustomerMasterKey,
  getVehicleMasterByIdKey,
  getCustomerMasterByIdKey,
} from "@/lib/google-sheets";
import { MasterVehicle, MasterCustomer, SheetsApiResponse } from "@/types";

// =============================================================================
// SWR設定
// =============================================================================

/** SWR設定: TTL 1時間、再検証間隔 5分 */
const swrConfig = {
  revalidateOnFocus: true, // フォーカス時に再検証
  revalidateOnReconnect: true, // 再接続時に再検証
  dedupingInterval: 5 * 60 * 1000, // 5分間は重複リクエストを抑制
  focusThrottleInterval: 5 * 60 * 1000, // フォーカス時の再検証を5分ごとに制限
  errorRetryCount: 3, // エラー時のリトライ回数
  errorRetryInterval: 5000, // リトライ間隔（5秒）
};

// =============================================================================
// 車両マスタフック
// =============================================================================

/**
 * 車両マスタを取得（SWRキャッシュ付き）
 * 
 * @param customerId - 顧客ID（オプション: 特定顧客の車両のみ取得）
 * @returns 車両マスタのリストとローディング状態
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export function useVehicleMaster(customerId?: string) {
  const key = getVehicleMasterKey(customerId);
  const { data, error, isLoading, mutate } = useSWR<SheetsApiResponse<MasterVehicle>>(
    key,
    () => fetchVehicleMaster(customerId),
    {
      ...swrConfig,
      // TTL: 1時間（3600000ms）
      // ただし、SWRのデフォルトではstale-while-revalidateなので、
      // キャッシュが古くなっても即座に無効化せず、バックグラウンドで再検証
    }
  );

  return {
    vehicles: data?.data || [],
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
    error,
    mutate, // 手動で再検証する場合
  };
}

/**
 * 車両IDで車両マスタを検索（SWRキャッシュ付き）
 * 
 * @param vehicleId - 車両ID
 * @returns 車両マスタとローディング状態
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export function useVehicleMasterById(vehicleId: string | null) {
  const key = vehicleId ? getVehicleMasterByIdKey(vehicleId) : null;
  const { data, error, isLoading, mutate } = useSWR<MasterVehicle | null>(
    key,
    () => (vehicleId ? findVehicleMasterById(vehicleId) : Promise.resolve(null)),
    {
      ...swrConfig,
    }
  );

  return {
    vehicle: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// =============================================================================
// 顧客マスタフック
// =============================================================================

/**
 * 顧客マスタを取得（SWRキャッシュ付き）
 * 
 * @param customerId - 顧客ID（オプション: 特定顧客のみ取得）
 * @returns 顧客マスタのリストとローディング状態
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export function useCustomerMaster(customerId?: string) {
  const key = getCustomerMasterKey(customerId);
  const { data, error, isLoading, mutate } = useSWR<SheetsApiResponse<MasterCustomer>>(
    key,
    () => fetchCustomerMaster(customerId),
    {
      ...swrConfig,
    }
  );

  return {
    customers: data?.data || [],
    lastUpdated: data?.lastUpdated,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * 顧客IDで顧客マスタを検索（SWRキャッシュ付き）
 * 
 * @param customerId - 顧客ID（例: K1001）
 * @returns 顧客マスタとローディング状態
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export function useCustomerMasterById(customerId: string | null) {
  const key = customerId ? getCustomerMasterByIdKey(customerId) : null;
  const { data, error, isLoading, mutate } = useSWR<MasterCustomer | null>(
    key,
    () => (customerId ? findCustomerMasterById(customerId) : Promise.resolve(null)),
    {
      ...swrConfig,
    }
  );

  return {
    customer: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

























