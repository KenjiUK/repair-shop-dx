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
  CourtesyCar,
  DiagnosisItem,
  EstimateItem,
  ApiResponse,
  JobMemo,
  ZohoAttachment,
  HistoricalEstimate,
  HistoricalJob,
  PartsInfo,
  PartItem,
  EnhancedOBDDiagnosticResult,
  QualityInspection,
  ManufacturerInquiry,
  WorkOrder,
} from "@/types";

import {
  parseWorkOrdersFromZoho,
  serializeWorkOrdersForZoho,
  updateWorkOrder as updateWorkOrderUtil,
} from "./work-order-converter";

import {
  jobs,
  customers,
  vehicles,
  smartTags,
  courtesyCars,
  sampleDiagnosisItems,
  sampleEstimateItems,
  getJobById,
  getCustomerById,
  getVehicleById,
  getAvailableTags,
  getTodayJobs,
  getAllLongTermProjectJobs,
  getAvailableCourtesyCars,
  getAllCourtesyCars,
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
  return success([...jobs]);
}

/**
 * 今日のジョブを取得
 */
export async function fetchTodayJobs(): Promise<ApiResponse<ZohoJob[]>> {
  await delay();
  const todayJobs = getTodayJobs();

  // バージョン番号が存在しない場合は初期化（競合制御用）
  todayJobs.forEach((job) => {
    if (job.version === undefined || job.version === null) {
      const jobIndex = jobs.findIndex((j) => j.id === job.id);
      if (jobIndex !== -1) {
        jobs[jobIndex].version = 1;
        job.version = 1;
      }
    }
  });

  return success(todayJobs);
}

/**
 * 長期プロジェクト管理用：すべての長期プロジェクトを取得（過去30日以内 + 今日）
 */
export async function fetchAllLongTermProjectJobs(): Promise<ApiResponse<ZohoJob[]>> {
  await delay();
  const allLongTermJobs = getAllLongTermProjectJobs();
  return success(allLongTermJobs);
}

/**
 * ジョブ詳細を取得
 */
export async function fetchJobById(id: string): Promise<ApiResponse<ZohoJob>> {
  await delay();

  // 検証用サンプルデータの注入
  if (id === "sample-shaken-001") {
    const sampleJob = {
      id: "sample-shaken-001",
      field5: "入庫済み",
      stage: "入庫済み",
      field6: { name: "BMW X3", id: "vehicle-001" }, // 車両
      field4: { name: "山田 太郎", id: "customer-001" }, // 顧客
      field10: 54000, // 走行距離
      field22: new Date().toISOString(), // 入庫日時 (必須)
      field: null, // 受付メモ
      field7: "ブレーキから異音", // 不具合内容
      field13: null, // 作業内容
      field19: null, // 共有フォルダURL
      field12: null, // 関連ファイル
      ID_BookingId: null, // 予約ID
      field_work_orders: JSON.stringify([
        { id: "wo-sample-001", serviceKind: "車検", status: "未着手" }
      ]),
      // name: "車検 - BMW X3", // ZohoJob型にはnameプロパティがないためコメントアウト
      // created_time: new Date().toISOString(), // ZohoJob型にはcreated_timeプロパティがないためコメントアウト
      // updated_time: new Date().toISOString(), // ZohoJob型にはupdated_timeプロパティがないためコメントアウト
      // 必須フィールドのダミー値
      field1: "dummy",
      Owner: { name: "Staff", id: "staff-001", email: "staff@example.com" },
      Created_By: { name: "Admin", id: "admin-001", email: "admin@example.com" },
      Modified_By: { name: "Admin", id: "admin-001", email: "admin@example.com" },
      Tag: [],
      $state: "save",
      $approved: true,
      $approval: { delegate: false, approve: false, reject: false, resubmit: false },
      $editable: true,
      $orchestration: false,
      $in_merge: false,
      $approval_state: "approved"
    } as ZohoJob;
    return success(sampleJob);
  }

  const job = getJobById(id);

  if (!job) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // バージョン番号が存在しない場合は初期化（競合制御用）
  if (job.version === undefined || job.version === null) {
    const jobIndex = jobs.findIndex((j) => j.id === id);
    if (jobIndex !== -1) {
      jobs[jobIndex].version = 1;
      job.version = 1;
    }
  }

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
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // 状態を更新（モックなので直接変更）
  jobs[jobIndex].field5 = status;
  jobs[jobIndex].stage = status;

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブのfield6（車両ID）を更新
 * Lookupフィールド更新時の参照先レコードID検証を実装
 */
export async function updateJobField6(
  id: string,
  vehicleId: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // Lookupフィールド更新時の参照先レコードID検証
  const { validateVehicleLookup } = await import("./lookup-field-validation");
  const validationResult = await validateVehicleLookup(vehicleId);
  if (!validationResult.success) {
    return error(
      "LOOKUP_VALIDATION_FAILED",
      validationResult.error?.message || `車両ID ${vehicleId} の検証に失敗しました`
    );
  }

  // 車両を取得
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    return error("NOT_FOUND", `Vehicle ${vehicleId} が見つかりません`);
  }

  // field6を更新（モックなので直接変更）
  jobs[jobIndex].field6 = {
    id: vehicle.id,
    name: vehicle.field44 || "車名未登録",
  };
  jobs[jobIndex].vehicle = jobs[jobIndex].field6;

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブのfield10（走行距離）を更新
 */
export async function updateJobField10(
  id: string,
  mileage: number
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // field10を更新（モックなので直接変更）
  jobs[jobIndex].field10 = mileage;
  jobs[jobIndex].mileage = mileage;

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブのfield7（詳細情報）を更新
 */
export async function updateJobField7(
  id: string,
  field7: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // field7を更新（モックなので直接変更）
  jobs[jobIndex].field7 = field7;
  jobs[jobIndex].details = field7;

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブのfield26（作業メモ）を更新
 */
export async function updateJobField26(
  id: string,
  field26: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // field26を更新（モックなので直接変更）
  jobs[jobIndex].field26 = field26;
  jobs[jobIndex].jobMemosField = field26;

  // jobMemosとPartsInfoを更新（パースして保存）
  try {
    const parsed = JSON.parse(field26);
    if (Array.isArray(parsed)) {
      // 旧形式（jobMemosのみ）
      jobs[jobIndex].jobMemos = parsed as JobMemo[];
      jobs[jobIndex].lastMemoUpdatedAt = new Date().toISOString();
    } else if (typeof parsed === "object" && parsed !== null) {
      // 新形式（jobMemosとPartsInfoを含む）
      if (Array.isArray(parsed.jobMemos)) {
        jobs[jobIndex].jobMemos = parsed.jobMemos as JobMemo[];
        jobs[jobIndex].lastMemoUpdatedAt = new Date().toISOString();
      }
      if (parsed.partsInfo) {
        jobs[jobIndex].partsInfo = parsed.partsInfo as PartsInfo;
      }
    }
  } catch (error) {
    console.error("[API] updateJobField26: JSONパースエラー", error);
  }

  return success({ ...jobs[jobIndex] });
}

/**
 * 作業メモを追加
 */
export async function addJobMemo(
  jobId: string,
  memo: JobMemo
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 既存のメモを取得
  const existingMemos = jobs[jobIndex].jobMemos || [];
  const updatedMemos = [memo, ...existingMemos]; // 新しいメモを先頭に追加

  // field26を更新
  const field26Value = JSON.stringify(updatedMemos);
  jobs[jobIndex].field26 = field26Value;
  jobs[jobIndex].jobMemosField = field26Value;
  jobs[jobIndex].jobMemos = updatedMemos;
  jobs[jobIndex].lastMemoUpdatedAt = new Date().toISOString();

  return success({ ...jobs[jobIndex] });
}

/**
 * 作業メモを更新
 */
export async function updateJobMemo(
  jobId: string,
  memoId: string,
  content: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 既存のメモを取得
  const existingMemos = jobs[jobIndex].jobMemos || [];
  const updatedMemos = existingMemos.map((memo) =>
    memo.id === memoId
      ? {
        ...memo,
        content,
        updatedAt: new Date().toISOString(),
      }
      : memo
  );

  // field26を更新
  const field26Value = JSON.stringify(updatedMemos);
  jobs[jobIndex].field26 = field26Value;
  jobs[jobIndex].jobMemosField = field26Value;
  jobs[jobIndex].jobMemos = updatedMemos;
  jobs[jobIndex].lastMemoUpdatedAt = new Date().toISOString();

  return success({ ...jobs[jobIndex] });
}

/**
 * 作業メモを削除
 */
export async function deleteJobMemo(
  jobId: string,
  memoId: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 既存のメモを取得
  const existingMemos = jobs[jobIndex].jobMemos || [];
  const updatedMemos = existingMemos.filter((memo) => memo.id !== memoId);

  // field26を更新
  const field26Value = updatedMemos.length > 0 ? JSON.stringify(updatedMemos) : null;
  jobs[jobIndex].field26 = field26Value || undefined;
  jobs[jobIndex].jobMemosField = field26Value || undefined;
  jobs[jobIndex].jobMemos = updatedMemos.length > 0 ? updatedMemos : undefined;
  jobs[jobIndex].lastMemoUpdatedAt = updatedMemos.length > 0 ? new Date().toISOString() : null;

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブの診断料金を更新
 */
export async function updateJobDiagnosisFee(
  id: string,
  diagnosisFee: number | null,
  diagnosisDuration?: number | null
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // 診断料金を更新（モックなので直接変更）
  jobs[jobIndex].diagnosisFee = diagnosisFee;
  if (diagnosisDuration !== undefined) {
    jobs[jobIndex].diagnosisDuration = diagnosisDuration;
  }

  // field7に診断料金情報を追記（既存の詳細情報がある場合は改行で区切って追加）
  const currentDetails = jobs[jobIndex].field7 || "";
  const diagnosisFeeText = diagnosisFee !== null
    ? `【診断料金】¥${diagnosisFee.toLocaleString()}${diagnosisDuration ? `（診断時間: ${diagnosisDuration}分）` : ""}`
    : "";

  if (diagnosisFeeText) {
    // 既存の【診断料金】セクションを削除してから追加
    const lines = currentDetails.split("\n");
    const filteredLines = lines.filter(line => !line.includes("【診断料金】"));
    const newDetails = filteredLines.length > 0
      ? `${filteredLines.join("\n")}\n${diagnosisFeeText}`
      : diagnosisFeeText;
    jobs[jobIndex].field7 = newDetails;
    jobs[jobIndex].details = newDetails;
  }

  return success({ ...jobs[jobIndex] });
}

/**
 * ジョブの基幹システム連携IDを更新
 */
export async function updateJobBaseSystemId(
  id: string,
  baseSystemId: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // 基幹システム連携IDを更新（モックなので直接変更）
  jobs[jobIndex].field_base_system_id = baseSystemId;
  jobs[jobIndex].baseSystemId = baseSystemId;

  return success({ ...jobs[jobIndex] });
}

/**
 * Jobのfield19（お客様共有フォルダURL）を更新
 */
export async function updateJobField19(
  id: string,
  folderUrl: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${id} が見つかりません`);
  }

  // field19を更新（モックなので直接変更）
  jobs[jobIndex].field19 = folderUrl;
  jobs[jobIndex].customerFolderUrl = folderUrl;

  return success({ ...jobs[jobIndex] });
}

/**
 * チェックイン処理（タグ紐付け + ステータス更新 + 代車貸出）
 * トランザクション処理: 全ての検証を先に実行し、全て成功したら更新処理を実行
 */
export async function checkIn(
  jobId: string,
  tagId: string,
  courtesyCarId?: string | null,
  isUrgent?: boolean
): Promise<ApiResponse<{ job: ZohoJob; tag: SmartTag; car?: CourtesyCar }>> {
  await delay();

  // =============================================================================
  // Phase 1: 全ての検証を先に実行（ロールバック用に元の状態を保存）
  // =============================================================================

  // ジョブを検索
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // タグを検索
  const tagIndex = smartTags.findIndex((t) => t.tagId === tagId);
  if (tagIndex === -1) {
    return error("NOT_FOUND", `Tag ${tagId} が見つかりません`);
  }

  // タグが使用中でないか確認
  if (smartTags[tagIndex].status === "in_use") {
    return error("TAG_IN_USE", `Tag ${tagId} は既に使用中です`);
  }

  // 代車の検証（指定されている場合）
  let carIndex: number | undefined;
  let originalCarState: CourtesyCar | undefined;
  if (courtesyCarId) {
    carIndex = courtesyCars.findIndex((c) => c.carId === courtesyCarId);
    if (carIndex === -1) {
      return error("NOT_FOUND", `代車 ${courtesyCarId} が見つかりません`);
    }

    // 代車が利用可能（available）または選択中（reserving）の場合のみ貸出可能
    if (courtesyCars[carIndex].status !== "available" && courtesyCars[carIndex].status !== "reserving") {
      return error("CAR_NOT_AVAILABLE", `代車 ${courtesyCarId} は利用できません`);
    }

    // ロールバック用に元の状態を保存
    originalCarState = { ...courtesyCars[carIndex] };
  }

  // ロールバック用に元の状態を保存
  const originalJob = { ...jobs[jobIndex] };
  const originalTag = { ...smartTags[tagIndex] };
  let rentedCar: CourtesyCar | undefined;

  // =============================================================================
  // Phase 2: 全ての検証が成功したら更新処理を実行
  // =============================================================================

  try {
    // 入庫時の正確な日時を保存
    const checkInDateTime = new Date().toISOString();

    // ジョブにタグを紐付け
    jobs[jobIndex].tagId = tagId;
    jobs[jobIndex].field22 = checkInDateTime;
    jobs[jobIndex].arrivalDateTime = checkInDateTime;

    // 緊急対応フラグを設定
    if (isUrgent) {
      jobs[jobIndex].isUrgent = true;
      // field7に緊急対応のプレフィックスを追加
      const urgentPrefix = "【緊急対応】";
      const currentField7 = jobs[jobIndex].field7 || "";
      if (!currentField7.startsWith(urgentPrefix)) {
        jobs[jobIndex].field7 = `${urgentPrefix}\n${currentField7}`.trim();
        jobs[jobIndex].details = jobs[jobIndex].field7;
      }
    } else {
      jobs[jobIndex].isUrgent = false;
    }

    // 一時帰宅情報がある場合、削除する（再入庫完了）
    if (jobs[jobIndex].field7 && !isUrgent) {
      const { appendTemporaryReturnInfoToField7 } = await import("@/lib/temporary-return-parser");
      const updatedField7 = appendTemporaryReturnInfoToField7(jobs[jobIndex].field7, null);
      jobs[jobIndex].field7 = updatedField7;
      jobs[jobIndex].details = updatedField7;
    }

    // ステータスを更新
    // 一時帰宅中で見積承認済み（作業待ち）の場合は「作業待ち」のまま、それ以外は「入庫済み」
    if (jobs[jobIndex].field5 === "作業待ち") {
      // 見積承認済みで再入庫した場合、作業待ちのまま
      jobs[jobIndex].stage = "作業待ち";
    } else {
      jobs[jobIndex].field5 = "入庫済み";
      jobs[jobIndex].stage = "入庫済み";
    }

    // タグの状態を更新
    smartTags[tagIndex].jobId = jobId;
    smartTags[tagIndex].linkedAt = checkInDateTime;
    smartTags[tagIndex].status = "in_use";

    // 代車の貸出処理（指定されている場合）
    if (courtesyCarId && carIndex !== undefined) {
      // 選択中（reserving）ステータスから貸出中（in_use）に更新
      courtesyCars[carIndex].jobId = jobId;
      courtesyCars[carIndex].rentedAt = checkInDateTime;
      courtesyCars[carIndex].status = "in_use";
      rentedCar = { ...courtesyCars[carIndex] };
    }

    return success({
      job: { ...jobs[jobIndex] },
      tag: { ...smartTags[tagIndex] },
      car: rentedCar,
    });
  } catch (updateError) {
    // エラーが発生した場合、ロールバック
    console.error("[API] checkIn: Update failed, rolling back", updateError);

    // ジョブの状態を復元
    jobs[jobIndex] = { ...originalJob };

    // タグの状態を復元
    smartTags[tagIndex] = { ...originalTag };

    // 代車の状態を復元（更新していた場合）
    if (courtesyCarId && carIndex !== undefined && originalCarState) {
      courtesyCars[carIndex] = { ...originalCarState };
    }

    return error("INTERNAL_ERROR", `更新処理に失敗しました: ${updateError instanceof Error ? updateError.message : "不明なエラー"}`);
  }

  // ジョブにタグを紐付け
  const checkInDateTime = new Date().toISOString();
  jobs[jobIndex].tagId = tagId;
  jobs[jobIndex].field22 = checkInDateTime; // 入庫時の正確な日時を保存
  jobs[jobIndex].arrivalDateTime = checkInDateTime;

  // 緊急対応フラグを設定
  if (isUrgent) {
    jobs[jobIndex].isUrgent = true;
    // field7に緊急対応のプレフィックスを追加
    const urgentPrefix = "【緊急対応】";
    const currentField7 = jobs[jobIndex].field7 || "";
    if (!currentField7.startsWith(urgentPrefix)) {
      jobs[jobIndex].field7 = `${urgentPrefix}\n${currentField7}`.trim();
      jobs[jobIndex].details = jobs[jobIndex].field7;
    }
  } else {
    jobs[jobIndex].isUrgent = false;
  }

  // 一時帰宅情報がある場合、削除する（再入庫完了）
  if (jobs[jobIndex].field7 && !isUrgent) {
    const { appendTemporaryReturnInfoToField7 } = await import("@/lib/temporary-return-parser");
    const updatedField7 = appendTemporaryReturnInfoToField7(jobs[jobIndex].field7, null);
    jobs[jobIndex].field7 = updatedField7;
    jobs[jobIndex].details = updatedField7;
  }

  // ステータスを更新
  // 一時帰宅中で見積承認済み（作業待ち）の場合は「作業待ち」のまま、それ以外は「入庫済み」
  if (jobs[jobIndex].field5 === "作業待ち") {
    // 見積承認済みで再入庫した場合、作業待ちのまま
    jobs[jobIndex].stage = "作業待ち";
  } else {
    jobs[jobIndex].field5 = "入庫済み";
    jobs[jobIndex].stage = "入庫済み";
  }

  // タグの状態を更新
  smartTags[tagIndex].jobId = jobId;
  smartTags[tagIndex].linkedAt = new Date().toISOString();
  smartTags[tagIndex].status = "in_use";

  return success({
    job: { ...jobs[jobIndex] },
    tag: { ...smartTags[tagIndex] },
    car: rentedCar,
  });
}

/**
 * ジョブのタグを変更
 */
export async function updateJobTag(
  jobId: string,
  newTagId: string
): Promise<ApiResponse<{ job: ZohoJob; oldTag?: SmartTag; newTag: SmartTag }>> {
  await delay();

  try {
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
    }

    // 新しいタグを検索
    const newTagIndex = smartTags.findIndex((t) => t.tagId === newTagId);
    if (newTagIndex === -1) {
      console.log("[API] updateJobTag: NEW TAG NOT FOUND", newTagId);
      return error("NOT_FOUND", `Tag ${newTagId} が見つかりません`);
    }

    // 新しいタグが使用中でないか確認（ただし、現在のジョブが既に使用している場合はOK）
    if (smartTags[newTagIndex].status === "in_use" && smartTags[newTagIndex].jobId !== jobId) {
      console.log("[API] updateJobTag: NEW TAG IN USE", newTagId);
      return error("TAG_IN_USE", `Tag ${newTagId} は既に使用中です`);
    }

    // 既存のタグを解除（存在する場合）
    let oldTag: SmartTag | undefined;
    const oldTagId = jobs[jobIndex].tagId;
    if (oldTagId && oldTagId !== newTagId) {
      const oldTagIndex = smartTags.findIndex((t) => t.tagId === oldTagId);
      if (oldTagIndex !== -1) {
        oldTag = { ...smartTags[oldTagIndex] };
        smartTags[oldTagIndex].jobId = null;
        smartTags[oldTagIndex].linkedAt = null;
        smartTags[oldTagIndex].status = "available";
        console.log("[API] updateJobTag: Old Tag", oldTagId, "解除");
      }
    }

    // 新しいタグを紐付け
    jobs[jobIndex].tagId = newTagId;
    smartTags[newTagIndex].jobId = jobId;
    smartTags[newTagIndex].linkedAt = new Date().toISOString();
    smartTags[newTagIndex].status = "in_use";

    console.log("[API] updateJobTag:", jobId, "← Tag", newTagId, oldTagId ? `(旧: ${oldTagId})` : "");
    return success({
      job: { ...jobs[jobIndex] },
      oldTag,
      newTag: { ...smartTags[newTagIndex] },
    });
  } catch (err) {
    console.error("[API] updateJobTag: ERROR", jobId, newTagId, err);
    return error(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "タグの変更に失敗しました"
    );
  }
}

/**
 * タグをジョブから解除（タグが使用中の場合に使用）
 * 
 * @param tagId 解除するタグID
 * @returns 解除されたジョブID（存在する場合）
 */
export async function unlinkTagFromJob(
  tagId: string
): Promise<ApiResponse<{ jobId: string | null }>> {
  await delay();

  try {
    const tagIndex = smartTags.findIndex((t) => t.tagId === tagId);
    if (tagIndex === -1) {
      console.log("[API] unlinkTagFromJob: TAG NOT FOUND", tagId);
      return error("NOT_FOUND", `Tag ${tagId} が見つかりません`);
    }

    const jobId = smartTags[tagIndex].jobId;

    // タグが使用中でない場合は、既に解除済み
    if (smartTags[tagIndex].status !== "in_use" || !jobId) {
      console.log("[API] unlinkTagFromJob: Tag not in use", tagId);
      return success({ jobId: null });
    }

    // ジョブからタグを解除
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex !== -1) {
      jobs[jobIndex].tagId = null;
      console.log("[API] unlinkTagFromJob: Job", jobId, "からタグを解除");
    } else {
      console.warn("[API] unlinkTagFromJob: Job not found", jobId, "（タグには紐付けられているが、ジョブが見つかりません）");
    }

    // タグの状態を更新
    smartTags[tagIndex].jobId = null;
    smartTags[tagIndex].linkedAt = null;
    smartTags[tagIndex].status = "available";

    console.log("[API] unlinkTagFromJob: Tag", tagId, "解除");
    return success({ jobId });
  } catch (err) {
    console.error("[API] unlinkTagFromJob: ERROR", tagId, err);
    return error(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "タグの解除に失敗しました"
    );
  }
}

/**
 * チェックアウト処理（タグ解除 + ステータス更新 + 代車返却）
 * 
 * @param jobId ジョブID
 * @param options オプション
 * @param options.returnCourtesyCar 代車を返却するかどうか（デフォルト: true、代車が紐付けられている場合）
 */
export async function checkOut(
  jobId: string,
  options?: { returnCourtesyCar?: boolean }
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  try {
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      console.error("[API] checkOut: JOB NOT FOUND", jobId);
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
        console.log("[API] checkOut: Tag", tagId, "解除");
      } else {
        console.warn("[API] checkOut: Tag not found", tagId, "（ジョブには紐付けられているが、タグが見つかりません）");
        // 警告のみで処理は続行
      }
    }

    // 代車を返却（オプションが指定されている場合、またはデフォルトでtrueの場合）
    const shouldReturnCar = options?.returnCourtesyCar !== false;
    if (shouldReturnCar) {
      const carIndex = courtesyCars.findIndex((c) => c.jobId === jobId);
      if (carIndex !== -1) {
        courtesyCars[carIndex].jobId = null;
        courtesyCars[carIndex].rentedAt = null;
        courtesyCars[carIndex].status = "available";
        console.log("[API] checkOut: Courtesy car", courtesyCars[carIndex].carId, "返却");
      }
    }

    // ジョブを更新
    jobs[jobIndex].tagId = null;
    jobs[jobIndex].field5 = "出庫済み";
    jobs[jobIndex].stage = "出庫済み";

    console.log("[API] checkOut: SUCCESS", jobId);
    return success({ ...jobs[jobIndex] });
  } catch (err) {
    console.error("[API] checkOut: ERROR", jobId, err);
    return error(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "チェックアウト処理に失敗しました"
    );
  }
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
 * @param jobId - ジョブID（後方互換性のために必須）
 * @param workOrderId - ワークオーダーID（オプショナル、指定された場合はワークオーダーに保存）
 * @param data - 診断データ
 */
export async function saveDiagnosis(
  jobId: string,
  workOrderId: string | undefined,
  data: {
    items: DiagnosisItem[];
    photos: { position: string; url: string }[];
    mileage?: number;
    version?: number | null; // 競合制御用バージョン番号
    enhancedOBDDiagnosticResult?: EnhancedOBDDiagnosticResult | null; // OBD診断結果（拡張版）
    qualityInspection?: QualityInspection | null; // 品質検査結果
    manufacturerInquiry?: ManufacturerInquiry | null; // メーカー問い合わせ結果
    isComplete?: boolean; // 診断完了フラグ（true: 完了保存、false: 一時保存）
    // 24ヶ月点検リデザイン版の追加データ
    inspectionMeasurements?: {
      coConcentration?: number;
      hcConcentration?: number;
      brakePadFrontLeft?: number;
      brakePadFrontRight?: number;
      brakePadRearLeft?: number;
      brakePadRearRight?: number;
      tireDepthFrontLeft?: number;
      tireDepthFrontRight?: number;
      tireDepthRearLeft?: number;
      tireDepthRearRight?: number;
    };
    inspectionParts?: {
      engineOil?: number;
      oilFilter?: number;
      wiperRubber?: number;
      cleanAirFilter?: number;
      llc?: number;
      brakeFluid?: number;
    };
    customParts?: Array<{ name: string; quantity: string }>;
    qualityCheckData?: unknown; // 品質管理・最終検査データ
    maintenanceAdvice?: string; // 整備アドバイス
    obdPdfResult?: unknown; // OBD診断PDF結果
    additionalEstimateRequired?: unknown; // 追加見積（必須整備）
    additionalEstimateRecommended?: unknown; // 追加見積（推奨整備）
    additionalEstimateOptional?: unknown; // 追加見積（任意整備）
  }
): Promise<ApiResponse<{ saved: boolean; version?: number }>> {
  await delay();

  console.log("[API] saveDiagnosis:", jobId, workOrderId ? `workOrderId: ${workOrderId}` : "");
  console.log("  - Items:", data.items.length, "件");
  console.log("  - Photos:", data.photos.length, "枚");
  console.log("  - Mileage:", data.mileage);
  console.log("  - Version:", data.version);
  if (data.enhancedOBDDiagnosticResult) {
    console.log("  - OBD診断結果:", data.enhancedOBDDiagnosticResult.errorCodes?.length || 0, "件のエラーコード");
  }
  if (data.qualityInspection) {
    console.log("  - 品質検査:", data.qualityInspection.overallResult);
  }
  if (data.manufacturerInquiry) {
    console.log("  - メーカー問い合わせ:", data.manufacturerInquiry.lastUpdatedAt);
  }

  // ジョブを検索
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] saveDiagnosis: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // workOrderIdが指定されている場合、ワークオーダーに保存
  if (workOrderId) {
    const job = jobs[jobIndex];
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrdersJson = jobWithWorkOrders.field_work_orders || null;
    const workOrders = parseWorkOrdersFromZoho(workOrdersJson);

    const workOrderIndex = workOrders.findIndex((wo) => wo.id === workOrderId);
    if (workOrderIndex === -1) {
      console.log("[API] saveDiagnosis: WORK ORDER NOT FOUND", workOrderId);
      return error("NOT_FOUND", `WorkOrder ${workOrderId} が見つかりません`);
    }

    // 診断開始時間を記録（診断データが初めて保存される場合）
    const currentWorkOrder = workOrders[workOrderIndex];
    const isFirstDiagnosisSave = !currentWorkOrder.diagnosis?.startedAt && data.items.length > 0;
    const diagnosisStartedAt = isFirstDiagnosisSave ? new Date().toISOString() : currentWorkOrder.diagnosis?.startedAt;

    // ワークオーダーを更新
    const updatedWorkOrder = updateWorkOrderUtil(workOrders[workOrderIndex], {
      diagnosis: {
        items: data.items,
        photos: data.photos,
        enhancedOBDDiagnosticResult: data.enhancedOBDDiagnosticResult || undefined,
        qualityInspection: data.qualityInspection || undefined,
        manufacturerInquiry: data.manufacturerInquiry || undefined,
        // 24ヶ月点検リデザイン版の追加データ
        inspectionMeasurements: data.inspectionMeasurements || undefined,
        inspectionParts: data.inspectionParts || undefined,
        customParts: data.customParts || undefined,
        qualityCheckData: data.qualityCheckData || undefined,
        maintenanceAdvice: data.maintenanceAdvice || undefined,
        obdPdfResult: data.obdPdfResult || undefined,
        startedAt: diagnosisStartedAt || undefined,
      },
      ...(data.isComplete === true ? { status: "見積作成待ち" as const } : {}),
    });
    workOrders[workOrderIndex] = updatedWorkOrder;

    // ジョブのfield_work_ordersを更新
    const jobWithWorkOrdersUpdated = job as ZohoJob & { field_work_orders?: string | null };
    jobWithWorkOrdersUpdated.field_work_orders = serializeWorkOrdersForZoho(workOrders);

    // 走行距離を更新（指定されている場合）
    if (data.mileage) {
      jobs[jobIndex].field10 = data.mileage;
      jobs[jobIndex].mileage = data.mileage;
    }

    return success({ saved: true });
  }

  // workOrderIdが指定されていない場合、既存の動作（ジョブレベル）を維持
  // 競合検知（バージョン番号が指定されている場合）
  if (data.version !== undefined && data.version !== null) {
    const currentVersion = jobs[jobIndex].version || 0;
    if (data.version !== currentVersion) {
      console.log("[API] saveDiagnosis: CONFLICT DETECTED", jobId, `Expected: ${data.version}, Current: ${currentVersion}`);
      return error("CONFLICT", `データが他のユーザーによって更新されています。現在のバージョン: ${currentVersion}, 送信されたバージョン: ${data.version}`);
    }
  }

  // 実際のAPIでは保存処理を行う
  // モックなのでログ出力のみ

  // ステータスを更新（isCompleteがtrueの場合のみ）
  if (jobIndex !== -1) {
    // バージョン番号をインクリメント
    jobs[jobIndex].version = (jobs[jobIndex].version || 0) + 1;
    if (data.mileage) {
      jobs[jobIndex].field10 = data.mileage;
      jobs[jobIndex].mileage = data.mileage;
    }

    // isCompleteがtrueの場合のみステータスを「見積作成待ち」に更新
    if (data.isComplete === true) {
      jobs[jobIndex].field5 = "見積作成待ち";
      jobs[jobIndex].stage = "見積作成待ち";
    }
    // isCompleteがfalseまたは未指定の場合は一時保存（ステータス変更なし）
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
 * @param jobId - ジョブID（後方互換性のために必須）
 * @param workOrderId - ワークオーダーID（オプショナル、指定された場合はワークオーダーに保存）
 * @param items - 見積項目
 */
export async function createEstimate(
  jobId: string,
  workOrderId: string | undefined,
  items: EstimateItem[]
): Promise<ApiResponse<{ estimateId: string; items: EstimateItem[] }>> {
  await delay();

  console.log("[API] createEstimate:", jobId, workOrderId ? `workOrderId: ${workOrderId}` : "");
  console.log("  - Items:", items.length, "件");
  console.log("  - Total:", items.reduce((sum, i) => sum + i.price, 0), "円");

  // workOrderIdが指定されている場合、ワークオーダーに保存
  if (workOrderId) {
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      console.log("[API] createEstimate: JOB NOT FOUND", jobId);
      return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
    }

    const job = jobs[jobIndex];
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrdersJson = jobWithWorkOrders.field_work_orders || null;
    const workOrders = parseWorkOrdersFromZoho(workOrdersJson);

    const workOrderIndex = workOrders.findIndex((wo) => wo.id === workOrderId);
    if (workOrderIndex === -1) {
      console.log("[API] createEstimate: WORK ORDER NOT FOUND", workOrderId);
      return error("NOT_FOUND", `WorkOrder ${workOrderId} が見つかりません`);
    }

    // ワークオーダーを更新
    const updatedWorkOrder = updateWorkOrderUtil(workOrders[workOrderIndex], {
      estimate: { items },
      status: "顧客承認待ち" as const,
    });
    workOrders[workOrderIndex] = updatedWorkOrder;

    // ジョブのfield_work_ordersを更新
    const jobWithWorkOrdersUpdated = job as ZohoJob & { field_work_orders?: string | null };
    jobWithWorkOrdersUpdated.field_work_orders = serializeWorkOrdersForZoho(workOrders);

    // 見積IDを生成
    const estimateId = `est-${Date.now()}`;

    return success({ estimateId, items });
  }

  // workOrderIdが指定されていない場合、既存の動作を維持
  // 見積IDを生成
  const estimateId = `est-${Date.now()}`;

  return success({ estimateId, items });
}

/**
 * 見積を承認
 * @param jobId - ジョブID（後方互換性のために必須）
 * @param workOrderId - ワークオーダーID（オプショナル、指定された場合はワークオーダーに保存）
 * @param items - 全項目を含む（approved: true/falseフラグを持つ）
 */
export async function approveEstimate(
  jobId: string,
  workOrderId: string | undefined,
  items: EstimateItem[] // 全項目を含む（approved: true/falseフラグを持つ）
): Promise<ApiResponse<{ approved: boolean }>> {
  await delay();

  console.log("[API] approveEstimate:", jobId, workOrderId ? `workOrderId: ${workOrderId}` : "");

  // 承認された項目のみを抽出
  const approvedItems = items.filter((i) => i.approved !== false && i.selected !== false);
  console.log("  - Approved:", approvedItems.length, "件 / Total:", items.length, "件");

  // workOrderIdが指定されている場合、ワークオーダーに保存
  if (workOrderId) {
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      console.log("[API] approveEstimate: JOB NOT FOUND", jobId);
      return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
    }

    const job = jobs[jobIndex];
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrdersJson = jobWithWorkOrders.field_work_orders || null;
    const workOrders = parseWorkOrdersFromZoho(workOrdersJson);

    const workOrderIndex = workOrders.findIndex((wo) => wo.id === workOrderId);
    if (workOrderIndex === -1) {
      console.log("[API] approveEstimate: WORK ORDER NOT FOUND", workOrderId);
      return error("NOT_FOUND", `WorkOrder ${workOrderId} が見つかりません`);
    }

    // ワークオーダーを更新
    const updatedWorkOrder = updateWorkOrderUtil(workOrders[workOrderIndex], {
      status: "作業待ち" as const,
    });
    workOrders[workOrderIndex] = updatedWorkOrder;

    // ジョブのfield_work_ordersを更新
    const jobWithWorkOrdersUpdated = job as ZohoJob & { field_work_orders?: string | null };
    jobWithWorkOrdersUpdated.field_work_orders = serializeWorkOrdersForZoho(workOrders);

    // ジョブ全体のステータスも更新（全ワークオーダーが完了した場合の判定は呼び出し側で行う）
    // ここでは、承認されたワークオーダーのステータスのみを更新

    return success({ approved: true });
  }

  // workOrderIdが指定されていない場合、既存の動作（ジョブレベル）を維持
  // ジョブのステータスを更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    jobs[jobIndex].field5 = "作業待ち";
    jobs[jobIndex].stage = "作業待ち";

    // 承認項目をテキストで保存
    const itemsText = approvedItems
      .map((i) => `${i.name}: ¥${i.price.toLocaleString()}`)
      .join("\n");
    jobs[jobIndex].field13 = itemsText;
    jobs[jobIndex].approvedWorkItems = itemsText;
  }

  return success({ approved: true });
}

/**
 * 見積を却下
 */
export async function rejectEstimate(
  jobId: string,
  rejectionReason: string
): Promise<ApiResponse<{ rejected: boolean }>> {
  await delay();

  console.log("[API] rejectEstimate:", jobId);
  console.log("  - Reason:", rejectionReason);

  // ジョブのステータスを更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    // ステータスを「見積作成待ち」に戻す（見積再作成のため）
    jobs[jobIndex].field5 = "見積作成待ち";
    jobs[jobIndex].stage = "見積作成待ち";

    // 却下理由をfield7に追記
    const currentField7 = jobs[jobIndex].field7 || "";
    const separator = currentField7 ? "\n\n" : "";
    const rejectionText = `【見積却下】${new Date().toLocaleString("ja-JP")}\n却下理由: ${rejectionReason}`;
    jobs[jobIndex].field7 = `${currentField7}${separator}${rejectionText}`;
    jobs[jobIndex].details = jobs[jobIndex].field7;

    // 顧客のDescriptionにも追記（事務員が確認しやすいように）
    const customerId = jobs[jobIndex].field4?.id;
    if (customerId) {
      const customer = getCustomerById(customerId);
      if (customer) {
        const currentDescription = customer.Description || "";
        const descSeparator = currentDescription ? "\n\n" : "";
        customer.Description = `${currentDescription}${descSeparator}${rejectionText}`;
      }
    }
  }

  return success({ rejected: true });
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
 * 顧客のDescriptionに変更要求を追記
 */
export async function appendToCustomerDescription(
  customerId: string,
  changeRequestText: string
): Promise<ApiResponse<ZohoCustomer>> {
  await delay();

  const customer = getCustomerById(customerId);
  if (!customer) {
    console.log("[API] appendToCustomerDescription: NOT FOUND", customerId);
    return error("NOT_FOUND", `Customer ${customerId} が見つかりません`);
  }

  // Descriptionに追記（既存の内容がある場合は改行を追加）
  const currentDescription = customer.Description || "";
  const separator = currentDescription ? "\n\n" : "";
  const newDescription = `${currentDescription}${separator}${changeRequestText}`;

  // Descriptionを更新（モックなので直接変更）
  customer.Description = newDescription;

  console.log("[API] appendToCustomerDescription:", customerId, "→", changeRequestText.substring(0, 50) + "...");
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

/**
 * 顧客情報を更新
 */
export async function updateCustomer(
  customerId: string,
  updateData: Partial<ZohoCustomer>
): Promise<ApiResponse<ZohoCustomer>> {
  await delay();

  const customer = getCustomerById(customerId);
  if (!customer) {
    console.log("[API] updateCustomer: NOT FOUND", customerId);
    return error("NOT_FOUND", `Customer ${customerId} が見つかりません`);
  }

  // 許可されたフィールドのみ更新
  // LINE ID、メール同意、誕生日などのフィールドのみ更新可能
  if (updateData.Business_Messaging_Line_Id !== undefined) {
    customer.Business_Messaging_Line_Id = updateData.Business_Messaging_Line_Id;
  }
  if (updateData.Email_Opt_Out !== undefined) {
    customer.Email_Opt_Out = updateData.Email_Opt_Out;
  }
  if (updateData.Date_of_Birth !== undefined) {
    customer.Date_of_Birth = updateData.Date_of_Birth;
  }
  if (updateData.Description !== undefined) {
    customer.Description = updateData.Description;
  }

  console.log("[API] updateCustomer:", customerId, "→", Object.keys(updateData).join(", "));
  return success({ ...customer });
}

/**
 * 顧客のDescriptionを更新（変更申請対応完了時）
 */
export async function updateCustomerDescription(
  customerId: string,
  description: string
): Promise<ApiResponse<ZohoCustomer>> {
  await delay();

  const customer = getCustomerById(customerId);
  if (!customer) {
    console.log("[API] updateCustomerDescription: NOT FOUND", customerId);
    return error("NOT_FOUND", `Customer ${customerId} が見つかりません`);
  }

  // Descriptionを更新（モックなので直接変更）
  customer.Description = description;

  console.log("[API] updateCustomerDescription:", customerId, "→", description.substring(0, 50) + "...");
  return success({ ...customer });
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
  
  // まず、customerId（ZohoのRecord ID）から顧客データを取得
  const customer = getCustomerById(customerId);
  if (!customer) {
    console.log("[API] fetchVehiclesByCustomerId: 顧客が見つかりません", customerId);
    return success([]);
  }
  
  // 顧客のID1（基幹システムの顧客ID）を使って車両を検索
  const baseCustomerId = customer.ID1 || customer.customerId || customerId;
  const customerVehicles = vehicles.filter(
    (v) => v.ID1 === baseCustomerId || v.customerId === baseCustomerId || v.ID1 === customerId || v.customerId === customerId
  );
  console.log("[API] fetchVehiclesByCustomerId:", customerId, "→", baseCustomerId, customerVehicles.length, "件");
  return success(customerVehicles);
}

/**
 * 新規車両を作成
 */
export async function createVehicle(
  customerId: string,
  vehicleName: string,
  licensePlate?: string | null
): Promise<ApiResponse<ZohoVehicle>> {
  await delay();

  // 車両IDを生成（モック環境では一時的なIDを使用）
  const vehicleId = `V${Date.now()}`;
  const vehicleRecordId = `veh-${Date.now()}`;

  // 新規車両を作成
  const newVehicle: ZohoVehicle = {
    id: vehicleRecordId,
    Name: vehicleId,
    vehicleId: vehicleId,
    field44: licensePlate || null,
    licensePlate: licensePlate || null,
    ID1: customerId,
    customerId: customerId,
    field7: null,
    inspectionExpiry: null,
  };

  // モックデータベースに追加
  vehicles.push(newVehicle);

  console.log("[API] createVehicle:", vehicleId, "for customer", customerId);
  return success({ ...newVehicle });
}

/**
 * Jobのfield12に画像を追加
 */
export async function addImageToJobField12(
  jobId: string,
  imageUrl: string,
  fileName: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] addImageToJobField12: NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // field12に画像を追加
  const currentAttachments = jobs[jobIndex].field12 || [];
  const newAttachment: ZohoAttachment = {
    id: `file-${Date.now()}`,
    file_name: fileName,
    download_url: imageUrl,
  };

  jobs[jobIndex].field12 = [...currentAttachments, newAttachment];
  jobs[jobIndex].attachments = jobs[jobIndex].field12;

  console.log("[API] addImageToJobField12:", jobId, "→", fileName);
  return success({ ...jobs[jobIndex] });
}

/**
 * 顧客IDでジョブを検索
 */
export async function fetchJobsByCustomerId(
  customerId: string
): Promise<ApiResponse<ZohoJob[]>> {
  await delay();
  const customerJobs = jobs.filter(
    (j) => j.field4?.id === customerId || j.customer?.id === customerId
  );
  console.log("[API] fetchJobsByCustomerId:", customerId, customerJobs.length, "件");
  return success(customerJobs);
}

// =============================================================================
// 改善提案 #6: 過去の見積・案件の参照機能
// =============================================================================

/**
 * 過去の見積を取得（顧客IDで検索）
 */
export async function fetchHistoricalEstimatesByCustomerId(
  customerId: string,
  options?: {
    dateRange?: "all" | "last_month" | "last_3_months" | "last_6_months" | "last_year";
    searchQuery?: string;
  }
): Promise<ApiResponse<HistoricalEstimate[]>> {
  await delay();

  // 顧客のジョブを取得
  const customerJobs = jobs.filter(
    (j) => j.field4?.id === customerId || j.customer?.id === customerId
  );

  // 見積が作成されているジョブを抽出
  const estimates: HistoricalEstimate[] = customerJobs
    .filter((job) => {
      // 見積が作成されているジョブのみ（見積提示済み以降のステータス）
      return (
        job.field5 === "見積提示済み" ||
        job.field5 === "作業待ち" ||
        job.field5 === "出庫待ち" ||
        job.field5 === "出庫済み"
      );
    })
    .map((job) => {
      // estimateItemsはZohoJobに存在しないため、空配列を使用
      const items: any[] = [];
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      return {
        id: `est-${job.id}`,
        jobId: job.id,
        customerName: job.field4?.name || job.customer?.name || "不明",
        vehicleName: job.field6?.name || job.vehicle?.name || "不明",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: item.selected,
          linkedPhotoUrls: item.linkedPhotoUrls || [],
          linkedVideoUrl: item.linkedVideoUrl || null,
          note: item.note || null,
        })),
        totalAmount,
        status: job.field5 || "不明",
        createdAt: job.field22 || new Date().toISOString(),
        submittedAt: null,
      };
    });

  // 日付範囲でフィルタリング
  let filteredEstimates = estimates;
  if (options?.dateRange && options.dateRange !== "all") {
    const now = new Date();
    let startDate: Date;

    switch (options.dateRange) {
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "last_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0);
    }

    filteredEstimates = filteredEstimates.filter((est) => {
      const estDate = new Date(est.createdAt);
      return estDate >= startDate;
    });
  }

  // 検索クエリでフィルタリング
  if (options?.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filteredEstimates = filteredEstimates.filter(
      (est) =>
        est.customerName.toLowerCase().includes(query) ||
        est.vehicleName.toLowerCase().includes(query) ||
        est.items.some((item) => item.name.toLowerCase().includes(query))
    );
  }

  // 作成日時の降順でソート
  filteredEstimates.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  console.log("[API] fetchHistoricalEstimatesByCustomerId:", customerId, filteredEstimates.length, "件");
  return success(filteredEstimates);
}

/**
 * 過去の案件を取得（顧客IDで検索）
 */
export async function fetchHistoricalJobsByCustomerId(
  customerId: string,
  options?: {
    statusFilter?: "all" | "completed" | "cancelled";
    searchQuery?: string;
  }
): Promise<ApiResponse<HistoricalJob[]>> {
  await delay();

  // 全期間のジョブを取得（過去の案件を含む）
  const allJobsResult = await fetchJobs();
  if (!allJobsResult.success || !allJobsResult.data) {
    return error("FETCH_ERROR", "ジョブの取得に失敗しました");
  }

  // 顧客のジョブを取得
  const customerJobs = allJobsResult.data.filter(
    (j) => j.field4?.id === customerId || j.customer?.id === customerId
  );

  // HistoricalJobに変換
  let historicalJobs: HistoricalJob[] = customerJobs.map((job) => ({
    id: job.id,
    customerName: job.field4?.name || job.customer?.name || "不明",
    vehicleName: job.field6?.name || job.vehicle?.name || "不明",
    status: job.field5,
    createdAt: job.field22 || new Date().toISOString(),
    arrivalDateTime: job.field22 || null,
  }));

  // ステータスでフィルタリング
  if (options?.statusFilter && options.statusFilter !== "all") {
    if (options.statusFilter === "completed") {
      historicalJobs = historicalJobs.filter(
        (job) => job.status === "出庫済み"
      );
    } else if (options.statusFilter === "cancelled") {
      // キャンセルされた案件（現在はステータスにないが、将来の拡張用）
      historicalJobs = historicalJobs.filter(
        (job) => job.status === "入庫待ち" // 仮の条件
      );
    }
  }

  // 検索クエリでフィルタリング
  if (options?.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    historicalJobs = historicalJobs.filter(
      (job) =>
        job.customerName.toLowerCase().includes(query) ||
        job.vehicleName.toLowerCase().includes(query)
    );
  }

  // 作成日時の降順でソート
  historicalJobs.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  console.log("[API] fetchHistoricalJobsByCustomerId:", customerId, historicalJobs.length, "件");
  return success(historicalJobs);
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
// Courtesy Car API
// =============================================================================

/**
 * 利用可能な代車を取得
 */
export async function fetchAvailableCourtesyCars(): Promise<ApiResponse<CourtesyCar[]>> {
  await delay();
  const available = getAvailableCourtesyCars();
  console.log("[API] fetchAvailableCourtesyCars:", available.length, "件");
  return success(available);
}

/**
 * 全代車を取得
 */
export async function fetchAllCourtesyCars(): Promise<ApiResponse<CourtesyCar[]>> {
  await delay();
  const all = getAllCourtesyCars();
  console.log("[API] fetchAllCourtesyCars:", all.length, "件");
  return success(all);
}

/**
 * タグIDからジョブを取得
 */
export async function fetchJobByTagId(tagId: string): Promise<ApiResponse<ZohoJob>> {
  await delay();
  const jobsResult = await fetchTodayJobs();
  if (!jobsResult.success || !jobsResult.data) {
    return error("NOT_FOUND", "ジョブの取得に失敗しました");
  }
  const job = jobsResult.data.find((j) => j.tagId === tagId);
  if (!job) {
    return error("NOT_FOUND", `タグID ${tagId} に関連付けられた案件が見つかりません`);
  }
  return success(job);
}

/**
 * QRコードからジョブを取得（タグIDとして検索）
 */
export async function fetchJobByQrCode(qrCode: string): Promise<ApiResponse<ZohoJob>> {
  // QRコードはタグIDとして扱う
  return fetchJobByTagId(qrCode);
}

/**
 * 代車を返却する
 */
export async function returnCourtesyCar(
  carId: string
): Promise<ApiResponse<CourtesyCar>> {
  await delay();

  const carIndex = courtesyCars.findIndex((c) => c.carId === carId);
  if (carIndex === -1) {
    console.log("[API] returnCourtesyCar: CAR NOT FOUND", carId);
    return error("NOT_FOUND", `代車 ${carId} が見つかりません`);
  }

  // 代車を返却状態に更新
  courtesyCars[carIndex].jobId = null;
  courtesyCars[carIndex].rentedAt = null;
  courtesyCars[carIndex].status = "available";

  console.log("[API] returnCourtesyCar:", carId);
  return success({ ...courtesyCars[carIndex] });
}

/**
 * ジョブの代車を変更する
 * 既存の代車を返却し、新しい代車を貸出する
 */
export async function updateJobCourtesyCar(
  jobId: string,
  newCarId: string | null
): Promise<ApiResponse<{ job: ZohoJob; oldCar?: CourtesyCar; newCar?: CourtesyCar }>> {
  await delay();

  // ジョブを検索
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] updateJobCourtesyCar: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 既存の代車を検索
  const oldCarIndex = courtesyCars.findIndex((c) => c.jobId === jobId);
  let oldCar: CourtesyCar | undefined;

  if (oldCarIndex !== -1) {
    oldCar = { ...courtesyCars[oldCarIndex] };

    // 既存の代車を返却
    courtesyCars[oldCarIndex].jobId = null;
    courtesyCars[oldCarIndex].rentedAt = null;
    courtesyCars[oldCarIndex].status = "available";
    console.log("[API] updateJobCourtesyCar: Old car returned", oldCar.carId);
  }

  // 新しい代車を貸出（指定されている場合）
  let newCar: CourtesyCar | undefined;
  if (newCarId) {
    const newCarIndex = courtesyCars.findIndex((c) => c.carId === newCarId);
    if (newCarIndex === -1) {
      console.log("[API] updateJobCourtesyCar: NEW CAR NOT FOUND", newCarId);
      return error("NOT_FOUND", `代車 ${newCarId} が見つかりません`);
    }

    // 代車が利用可能か確認
    if (courtesyCars[newCarIndex].status !== "available" && courtesyCars[newCarIndex].status !== "reserving") {
      console.log("[API] updateJobCourtesyCar: NEW CAR NOT AVAILABLE", newCarId, "status:", courtesyCars[newCarIndex].status);
      return error("CAR_NOT_AVAILABLE", `代車 ${newCarId} は利用できません`);
    }

    // 新しい代車を貸出
    const rentedAt = new Date().toISOString();
    courtesyCars[newCarIndex].jobId = jobId;
    courtesyCars[newCarIndex].rentedAt = rentedAt;
    courtesyCars[newCarIndex].status = "in_use";
    newCar = { ...courtesyCars[newCarIndex] };
    console.log("[API] updateJobCourtesyCar: New car rented", newCarId, "→ Job", jobId);
  }

  console.log("[API] updateJobCourtesyCar: Success", jobId, oldCar ? `Old: ${oldCar.carId}` : "No old car", newCar ? `New: ${newCar.carId}` : "No new car");
  return success({
    job: { ...jobs[jobIndex] },
    oldCar,
    newCar,
  });
}

// =============================================================================
// 改善提案 #8: 業務分析機能
// =============================================================================

import {
  AnalyticsData,
  generateAnalyticsData,
} from "@/lib/analytics-utils";

/**
 * 業務分析データを取得
 */
export async function fetchAnalyticsData(
  dateRange: "week" | "month" | "quarter" | "year",
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<AnalyticsData>> {
  await delay();

  // 全ジョブを取得（期間フィルタリングはクライアント側で行う）
  const allJobsResult = await fetchJobs();
  if (!allJobsResult.success || !allJobsResult.data) {
    return error("FETCH_ERROR", "ジョブの取得に失敗しました");
  }

  const analyticsData = generateAnalyticsData(
    allJobsResult.data,
    dateRange,
    startDate,
    endDate
  );

  console.log(
    "[API] fetchAnalyticsData:",
    dateRange,
    analyticsData.trendData.length,
    "データポイント"
  );
  return success(analyticsData);
}

/**
 * 売上分析データを取得
 */
export async function fetchRevenueAnalyticsData(
  dateRange: "week" | "month" | "quarter" | "year",
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<import("@/lib/analytics-utils").RevenueAnalyticsData>> {
  await delay();

  const params = new URLSearchParams({
    dateRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`/api/analytics/revenue?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return error(
      "FETCH_ERROR",
      errorData.error?.message || "売上分析データの取得に失敗しました"
    );
  }

  const result = await response.json();
  return result;
}

/**
 * 顧客分析データを取得
 */
export async function fetchCustomerAnalyticsData(
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<import("@/lib/analytics-utils").CustomerAnalyticsData>> {
  await delay();

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`/api/analytics/customer?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return error(
      "FETCH_ERROR",
      errorData.error?.message || "顧客分析データの取得に失敗しました"
    );
  }

  const result = await response.json();
  return result;
}

/**
 * 業務効率分析データを取得
 */
export async function fetchEfficiencyAnalyticsData(
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<import("@/lib/analytics-utils").EfficiencyAnalyticsData>> {
  await delay();

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`/api/analytics/efficiency?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return error(
      "FETCH_ERROR",
      errorData.error?.message || "業務効率分析データの取得に失敗しました"
    );
  }

  const result = await response.json();
  return result;
}

// =============================================================================
// Mechanic Assignment API
// =============================================================================

/**
 * 担当整備士を割り当てる
 */
export async function assignMechanic(
  jobId: string,
  mechanicName: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] assignMechanic: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 整備士を割り当て
  jobs[jobIndex].assignedMechanic = mechanicName;

  console.log("[API] assignMechanic:", jobId, "→", mechanicName);
  return success({ ...jobs[jobIndex] });
}

/**
 * 受付メモを更新する
 */
export async function updateWorkOrder(
  jobId: string,
  workOrder: string
): Promise<ApiResponse<ZohoJob>> {
  await delay();

  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    console.log("[API] updateWorkOrder: JOB NOT FOUND", jobId);
    return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
  }

  // 受付メモを更新（モックなので直接変更）
  jobs[jobIndex].field = workOrder || null;
  jobs[jobIndex].workOrder = workOrder || null;

  console.log("[API] updateWorkOrder:", jobId, "→", workOrder ? `${workOrder.substring(0, 50)}...` : "(削除)");
  return success({ ...jobs[jobIndex] });
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

  try {
    console.log("[API] completeWork:", jobId);
    console.log("  - Completed Items:", data.completedItems.length, "件");
    console.log("  - After Photos:", data.afterPhotos.length, "枚");

    // ジョブの存在確認
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      console.error("[API] completeWork: JOB NOT FOUND", jobId);
      return error("NOT_FOUND", `Job ${jobId} が見つかりません`);
    }

    // データの検証
    if (!data.completedItems || data.completedItems.length === 0) {
      console.warn("[API] completeWork: No completed items", jobId);
      // 警告のみで処理は続行（写真のみの場合もあるため）
    }

    // ジョブのステータスを更新
    jobs[jobIndex].field5 = "出庫待ち";
    jobs[jobIndex].stage = "出庫待ち";

    // 作業内容を更新（field13に保存）
    // 注意: 実際の実装では、完了した作業項目の情報をfield13に保存する必要がある
    // モック実装では簡易的に処理

    console.log("[API] completeWork: SUCCESS", jobId);
    return success({ completed: true });
  } catch (err) {
    console.error("[API] completeWork: ERROR", jobId, err);
    return error(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "作業完了処理に失敗しました"
    );
  }
}

