/**
 * APIクライアント (Mock Backend)
 * 
 * 本物のAPI通信をシミュレートする関数群
 * 全てPromiseを返し、擬似的な通信遅延を含む
 */

import {
  ZohoJob,
  ZohoCustomer,
  ZohoVehicle,
  JobStage,
  SmartTag,
  DiagnosisItem,
  EstimateItem,
  ApiResponse,
} from "@/types";

import {
  jobs,
  customers,
  vehicles,
  smartTags,
  sampleDiagnosisItems,
  sampleEstimateItems,
  getJobById,
  getCustomerById,
  getVehicleById,
  getAvailableTags,
  getTodayJobs,
} from "./mock-db";

// =============================================================================
// 設定
// =============================================================================

/** 擬似遅延時間 (ms) */
const MOCK_DELAY_MIN = 500;
const MOCK_DELAY_MAX = 1000;

/**
 * ランダムな遅延を発生させる
 */
function delay(): Promise<void> {
  const ms = Math.floor(Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN)) + MOCK_DELAY_MIN;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 成功レスポンスを生成
 */
function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * エラーレスポンスを生成
 */
function error(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

// =============================================================================
// Jobs API
// =============================================================================

/**
 * 全ジョブを取得
 */
export async function fetchJobs(): Promise<ApiResponse<ZohoJob[]>> {
  await delay();
  console.log("[API] fetchJobs:", jobs.length, "件");
  return success([...jobs]);
}

/**
 * 今日のジョブを取得
 */
export async function fetchTodayJobs(): Promise<ApiResponse<ZohoJob[]>> {
  await delay();
  const todayJobs = getTodayJobs();
  console.log("[API] fetchTodayJobs:", todayJobs.length, "件");
  return success(todayJobs);
}

/**
 * ジョブ詳細を取得
 */
export async function fetchJobById(id: string): Promise<ApiResponse<ZohoJob>> {
  await delay();
  const job = getJobById(id);
  
  if (!job) {
    console.log("[API] fetchJobById: NOT FOUND", id);
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }
  
  console.log("[API] fetchJobById:", id, job.field4?.name);
  return success({ ...job });
}

/**
 * ジョブのステータスを更新
 */
export async function updateJobStatus(
  id: string,
  status: JobStage
): Promise<ApiResponse<ZohoJob>> {
  await delay();
  
  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    console.log("[API] updateJobStatus: NOT FOUND", id);
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }
  
  // 状態を更新（モックなので直接変更）
  jobs[jobIndex].field5 = status;
  jobs[jobIndex].stage = status;
  
  console.log("[API] updateJobStatus:", id, "→", status);
  return success({ ...jobs[jobIndex] });
}

/**
 * チェックイン処理（タグ紐付け + ステータス更新）
 */
export async function checkIn(
  jobId: string,
  tagId: string
): Promise<ApiResponse<{ job: ZohoJob; tag: SmartTag }>> {
  await delay();
  
  // ジョブを検索
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] checkIn: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }
  
  // タグを検索
  const tagIndex = smartTags.findIndex((t) => t.tagId === tagId);
  if (tagIndex === -1) {
    console.log("[API] checkIn: TAG NOT FOUND", tagId);
    return error("NOT_FOUND", `Tag ${tagId} が見つかりません`);
  }
  
  // タグが使用中でないか確認
  if (smartTags[tagIndex].status === "in_use") {
    console.log("[API] checkIn: TAG IN USE", tagId);
    return error("TAG_IN_USE", `Tag ${tagId} は既に使用中です`);
  }
  
  // ジョブにタグを紐付け
  jobs[jobIndex].tagId = tagId;
  jobs[jobIndex].field5 = "見積作成待ち";
  jobs[jobIndex].stage = "見積作成待ち";
  
  // タグの状態を更新
  smartTags[tagIndex].jobId = jobId;
  smartTags[tagIndex].linkedAt = new Date().toISOString();
  smartTags[tagIndex].status = "in_use";
  
  console.log("[API] checkIn:", jobId, "← Tag", tagId);
  return success({
    job: { ...jobs[jobIndex] },
    tag: { ...smartTags[tagIndex] },
  });
}

/**
 * チェックアウト処理（タグ解除 + ステータス更新）
 */
export async function checkOut(jobId: string): Promise<ApiResponse<ZohoJob>> {
  await delay();
  
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] checkOut: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }
  
  const tagId = jobs[jobIndex].tagId;
  
  // タグを解除
  if (tagId) {
    const tagIndex = smartTags.findIndex((t) => t.tagId === tagId);
    if (tagIndex !== -1) {
      smartTags[tagIndex].jobId = null;
      smartTags[tagIndex].linkedAt = null;
      smartTags[tagIndex].status = "available";
    }
  }
  
  // ジョブを更新
  jobs[jobIndex].tagId = null;
  jobs[jobIndex].field5 = "出庫済み";
  jobs[jobIndex].stage = "出庫済み";
  
  console.log("[API] checkOut:", jobId, "Tag", tagId, "解除");
  return success({ ...jobs[jobIndex] });
}

// =============================================================================
// Diagnosis API
// =============================================================================

/**
 * 診断結果を取得
 */
export async function fetchDiagnosis(
  jobId: string
): Promise<ApiResponse<DiagnosisItem[]>> {
  await delay();
  console.log("[API] fetchDiagnosis:", jobId);
  // モックなので固定データを返す
  return success([...sampleDiagnosisItems]);
}

/**
 * 診断結果を保存
 */
export async function saveDiagnosis(
  jobId: string,
  data: {
    items: DiagnosisItem[];
    photos: { position: string; url: string }[];
    mileage?: number;
  }
): Promise<ApiResponse<{ saved: boolean }>> {
  await delay();
  
  console.log("[API] saveDiagnosis:", jobId);
  console.log("  - Items:", data.items.length, "件");
  console.log("  - Photos:", data.photos.length, "枚");
  console.log("  - Mileage:", data.mileage);
  
  // 実際のAPIでは保存処理を行う
  // モックなのでログ出力のみ
  
  // ステータスを更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    jobs[jobIndex].field5 = "見積作成待ち";
    jobs[jobIndex].stage = "見積作成待ち";
    if (data.mileage) {
      jobs[jobIndex].field10 = data.mileage;
      jobs[jobIndex].mileage = data.mileage;
    }
  }
  
  return success({ saved: true });
}

// =============================================================================
// Estimate API
// =============================================================================

/**
 * 見積を取得
 */
export async function fetchEstimate(
  jobId: string
): Promise<ApiResponse<EstimateItem[]>> {
  await delay();
  console.log("[API] fetchEstimate:", jobId);
  // モックなので固定データを返す
  return success([...sampleEstimateItems]);
}

/**
 * 見積を作成/保存
 */
export async function createEstimate(
  jobId: string,
  items: EstimateItem[]
): Promise<ApiResponse<{ estimateId: string; items: EstimateItem[] }>> {
  await delay();
  
  console.log("[API] createEstimate:", jobId);
  console.log("  - Items:", items.length, "件");
  console.log("  - Total:", items.reduce((sum, i) => sum + i.price, 0), "円");
  
  // 見積IDを生成
  const estimateId = `est-${Date.now()}`;
  
  return success({ estimateId, items });
}

/**
 * 見積を承認
 */
export async function approveEstimate(
  jobId: string,
  selectedItems: EstimateItem[]
): Promise<ApiResponse<{ approved: boolean }>> {
  await delay();
  
  console.log("[API] approveEstimate:", jobId);
  console.log("  - Selected:", selectedItems.length, "件");
  
  // ジョブのステータスを更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    jobs[jobIndex].field5 = "作業待ち";
    jobs[jobIndex].stage = "作業待ち";
    
    // 承認項目をテキストで保存
    const itemsText = selectedItems
      .map((i) => `${i.name}: ¥${i.price.toLocaleString()}`)
      .join("\n");
    jobs[jobIndex].field13 = itemsText;
    jobs[jobIndex].approvedWorkItems = itemsText;
  }
  
  return success({ approved: true });
}

// =============================================================================
// Customers API
// =============================================================================

/**
 * 顧客を取得
 */
export async function fetchCustomerById(
  id: string
): Promise<ApiResponse<ZohoCustomer>> {
  await delay();
  const customer = getCustomerById(id);
  
  if (!customer) {
    console.log("[API] fetchCustomerById: NOT FOUND", id);
    return error("NOT_FOUND", `Customer ${id} が見つかりません`);
  }
  
  console.log("[API] fetchCustomerById:", id, customer.Last_Name);
  return success({ ...customer });
}

/**
 * 全顧客を取得
 */
export async function fetchCustomers(): Promise<ApiResponse<ZohoCustomer[]>> {
  await delay();
  console.log("[API] fetchCustomers:", customers.length, "件");
  return success([...customers]);
}

// =============================================================================
// Vehicles API
// =============================================================================

/**
 * 車両を取得
 */
export async function fetchVehicleById(
  id: string
): Promise<ApiResponse<ZohoVehicle>> {
  await delay();
  const vehicle = getVehicleById(id);
  
  if (!vehicle) {
    console.log("[API] fetchVehicleById: NOT FOUND", id);
    return error("NOT_FOUND", `Vehicle ${id} が見つかりません`);
  }
  
  console.log("[API] fetchVehicleById:", id, vehicle.field44);
  return success({ ...vehicle });
}

/**
 * 全車両を取得
 */
export async function fetchVehicles(): Promise<ApiResponse<ZohoVehicle[]>> {
  await delay();
  console.log("[API] fetchVehicles:", vehicles.length, "件");
  return success([...vehicles]);
}

/**
 * 顧客IDで車両を検索
 */
export async function fetchVehiclesByCustomerId(
  customerId: string
): Promise<ApiResponse<ZohoVehicle[]>> {
  await delay();
  const customerVehicles = vehicles.filter(
    (v) => v.ID1 === customerId || v.customerId === customerId
  );
  console.log("[API] fetchVehiclesByCustomerId:", customerId, customerVehicles.length, "件");
  return success(customerVehicles);
}

// =============================================================================
// Tags API
// =============================================================================

/**
 * 利用可能なタグを取得
 */
export async function fetchAvailableTags(): Promise<ApiResponse<SmartTag[]>> {
  await delay();
  const available = getAvailableTags();
  console.log("[API] fetchAvailableTags:", available.length, "件");
  return success(available);
}

/**
 * 全タグを取得
 */
export async function fetchAllTags(): Promise<ApiResponse<SmartTag[]>> {
  await delay();
  console.log("[API] fetchAllTags:", smartTags.length, "件");
  return success([...smartTags]);
}

// =============================================================================
// Work Completion API
// =============================================================================

/**
 * 作業完了処理
 */
export async function completeWork(
  jobId: string,
  data: {
    completedItems: string[];
    afterPhotos: { itemId: string; url: string }[];
  }
): Promise<ApiResponse<{ completed: boolean }>> {
  await delay();
  
  console.log("[API] completeWork:", jobId);
  console.log("  - Completed Items:", data.completedItems.length, "件");
  console.log("  - After Photos:", data.afterPhotos.length, "枚");
  
  // ジョブのステータスを更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    jobs[jobIndex].field5 = "出庫待ち";
    jobs[jobIndex].stage = "出庫待ち";
  }
  
  return success({ completed: true });
}

