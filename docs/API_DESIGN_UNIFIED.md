# API設計統一仕様書

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: すべての入庫区分で使用する統一API設計
- **設計方針**: RESTful API設計原則に基づく統一設計

---

## 1. RESTful API設計原則

### 1-1. 基本原則

**リソース指向**:
- リソース名は複数形を使用
- リソースは名詞を使用
- アクションはHTTPメソッドで表現

**HTTPメソッド**:
- `GET`: リソースの取得
- `POST`: リソースの作成
- `PUT`: リソースの完全更新
- `PATCH`: リソースの部分更新
- `DELETE`: リソースの削除

### 1-2. エンドポイント命名規則

**基本パターン**:
```
/api/{resource}
/api/{resource}/{id}
/api/{resource}/{id}/{sub-resource}
/api/{resource}/{id}/{action}
```

**例**:
```
GET    /api/jobs
GET    /api/jobs/{id}
POST   /api/jobs/{id}/reception
GET    /api/jobs/{id}/work-orders
POST   /api/jobs/{id}/work-orders
PATCH  /api/jobs/{id}/work-orders/{workOrderId}
POST   /api/jobs/{id}/check-in
```

---

## 2. 統一リクエスト/レスポンス形式

### 2-1. リクエスト形式

**GETリクエスト**:
```typescript
// クエリパラメータ
GET /api/jobs?status=診断中&serviceKind=車検
```

**POST/PUT/PATCHリクエスト**:
```typescript
// リクエストボディ
{
  // リソース固有のフィールド
}
```

**Content-Type**:
- `application/json`

### 2-2. レスポンス形式

**成功レスポンス**:
```typescript
{
  success: true;
  data: T; // リソースデータ
}
```

**エラーレスポンス**:
```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 2-3. HTTPステータスコード

**成功**:
- `200 OK`: リクエスト成功
- `201 Created`: リソース作成成功
- `204 No Content`: リクエスト成功（レスポンスボディなし）

**クライアントエラー**:
- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 認証が必要
- `403 Forbidden`: 権限がない
- `404 Not Found`: リソースが見つからない
- `409 Conflict`: リソースの競合
- `422 Unprocessable Entity`: バリデーションエラー

**サーバーエラー**:
- `500 Internal Server Error`: 内部サーバーエラー
- `503 Service Unavailable`: サービス利用不可

---

## 3. エンドポイント設計

### 3-1. Jobs API

#### GET /api/jobs
**目的**: ジョブ一覧を取得

**クエリパラメータ**:
- `date`: 日付（YYYY-MM-DD形式、デフォルト: 今日）
- `status`: ステータス（オプション）
- `serviceKind`: 入庫区分（オプション）

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob[];
}
```

#### GET /api/jobs/{id}
**目的**: ジョブ詳細を取得

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

#### POST /api/jobs/{id}/reception
**目的**: 受付情報を保存

**リクエストボディ**:
```typescript
{
  mileage: number;
  // 入庫区分別の拡張フィールド
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

#### POST /api/jobs/{id}/check-in
**目的**: チェックイン処理

**リクエストボディ**:
```typescript
{
  tagId?: string;
  mechanicName?: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

### 3-2. Work Orders API

#### GET /api/jobs/{id}/work-orders
**目的**: ワークオーダー一覧を取得

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder[];
}
```

#### POST /api/jobs/{id}/work-orders
**目的**: ワークオーダーを追加

**リクエストボディ**:
```typescript
{
  serviceKind: ServiceKind;
  // 入庫区分別の初期データ
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

#### GET /api/jobs/{id}/work-orders/{workOrderId}
**目的**: ワークオーダー詳細を取得

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

#### PATCH /api/jobs/{id}/work-orders/{workOrderId}
**目的**: ワークオーダーを更新

**リクエストボディ**:
```typescript
{
  // 更新するフィールドのみ
  diagnosis?: DiagnosisData;
  estimate?: EstimateData;
  work?: WorkData;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

#### DELETE /api/jobs/{id}/work-orders/{workOrderId}
**目的**: ワークオーダーを削除

**レスポンス**:
```typescript
{
  success: true;
  data: null;
}
```

### 3-3. Diagnosis API

#### GET /api/jobs/{id}/work-orders/{workOrderId}/diagnosis
**目的**: 診断情報を取得

**レスポンス**:
```typescript
{
  success: true;
  data: DiagnosisData;
}
```

#### POST /api/jobs/{id}/work-orders/{workOrderId}/diagnosis
**目的**: 診断情報を保存

**リクエストボディ**:
```typescript
{
  // 入庫区分別の診断データ
  items?: DiagnosisItem[];
  photos: Photo[];
  videos?: Video[];
  comments: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

### 3-4. Estimate API

#### GET /api/jobs/{id}/work-orders/{workOrderId}/estimate
**目的**: 見積情報を取得

**レスポンス**:
```typescript
{
  success: true;
  data: EstimateData;
}
```

#### POST /api/jobs/{id}/work-orders/{workOrderId}/estimate
**目的**: 見積情報を保存

**リクエストボディ**:
```typescript
{
  items: EstimateItem[];
  parts?: PartItem[];
  approvalMethod?: "口頭承認" | "事前承認" | "システム承認";
  notes?: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

### 3-5. Work API

#### GET /api/jobs/{id}/work-orders/{workOrderId}/work
**目的**: 作業情報を取得

**レスポンス**:
```typescript
{
  success: true;
  data: WorkData;
}
```

#### POST /api/jobs/{id}/work-orders/{workOrderId}/work
**目的**: 作業情報を保存

**リクエストボディ**:
```typescript
{
  workContent: string;
  beforePhotos: Photo[];
  afterPhotos: Photo[];
  workDuration: number;
  notes: string;
  // 入庫区分別の拡張フィールド
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: WorkOrder;
}
```

### 3-6. Handover API

#### GET /api/jobs/{id}/handover
**目的**: 引渡情報を取得

**レスポンス**:
```typescript
{
  success: true;
  data: {
    workSummary: WorkSummary;
    // 入庫区分別の拡張情報
  };
}
```

#### POST /api/jobs/{id}/handover
**目的**: 引渡処理を実行

**リクエストボディ**:
```typescript
{
  // 入庫区分別の拡張フィールド
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

### 3-7. Photos API

#### POST /api/jobs/{id}/work-orders/{workOrderId}/photos
**目的**: 写真をアップロード

**リクエストボディ**:
```typescript
FormData {
  file: File;
  description?: string;
  type: "before" | "after" | "progress";
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: Photo;
}
```

#### DELETE /api/jobs/{id}/work-orders/{workOrderId}/photos/{photoId}
**目的**: 写真を削除

**レスポンス**:
```typescript
{
  success: true;
  data: null;
}
```

### 3-8. Videos API

#### POST /api/jobs/{id}/work-orders/{workOrderId}/videos
**目的**: 動画をアップロード

**リクエストボディ**:
```typescript
FormData {
  file: File;
  description?: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: Video;
}
```

#### DELETE /api/jobs/{id}/work-orders/{workOrderId}/videos/{videoId}
**目的**: 動画を削除

**レスポンス**:
```typescript
{
  success: true;
  data: null;
}
```

### 3-8-1. OBD診断結果 API（12ヶ月点検専用）

#### POST /api/jobs/{id}/work-orders/{workOrderId}/obd-diagnostic-result
**目的**: OBD診断結果PDFをアップロード（別システムで実施、決まったフォーマット）

**リクエストボディ**:
```typescript
FormData {
  file: File; // PDFファイル（決まったフォーマット）
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: {
    pdfUrl: string; // Google DriveのURL
    uploadedAt: Date;
  };
}
```

#### GET /api/jobs/{id}/work-orders/{workOrderId}/obd-diagnostic-result
**目的**: OBD診断結果PDFを取得

**レスポンス**:
```typescript
{
  success: true;
  data: {
    pdfUrl: string;
    uploadedAt: Date;
  } | null;
}
```

#### DELETE /api/jobs/{id}/work-orders/{workOrderId}/obd-diagnostic-result
**目的**: OBD診断結果PDFを削除

**レスポンス**:
```typescript
{
  success: true;
  data: null;
}
```

### 3-9. Master Data API

#### GET /api/vehicles
**目的**: 車両マスタを検索

**クエリパラメータ**:
- `customerId`: 顧客ID
- `licensePlate`: 登録番号（部分一致）

**レスポンス**:
```typescript
{
  success: true;
  data: VehicleMaster[];
}
```

#### GET /api/customers
**目的**: 顧客マスタを検索

**クエリパラメータ**:
- `customerId`: 顧客ID
- `name`: 顧客名（部分一致）

**レスポンス**:
```typescript
{
  success: true;
  data: CustomerMaster[];
}
```

### 3-10. Smart Tags API

#### GET /api/smart-tags
**目的**: スマートタグ一覧を取得

**レスポンス**:
```typescript
{
  success: true;
  data: SmartTag[];
}
```

#### GET /api/smart-tags/available
**目的**: 利用可能なスマートタグを取得

**レスポンス**:
```typescript
{
  success: true;
  data: SmartTag[];
}
```

#### POST /api/jobs/{id}/smart-tags
**目的**: スマートタグを紐付け

**リクエストボディ**:
```typescript
{
  tagId: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

### 3-11. Courtesy Cars API

#### GET /api/courtesy-cars
**目的**: 代車一覧を取得

**レスポンス**:
```typescript
{
  success: true;
  data: CourtesyCar[];
}
```

#### GET /api/courtesy-cars/available
**目的**: 利用可能な代車を取得

**レスポンス**:
```typescript
{
  success: true;
  data: CourtesyCar[];
}
```

#### POST /api/jobs/{id}/courtesy-cars
**目的**: 代車を紐付け

**リクエストボディ**:
```typescript
{
  courtesyCarId: string;
}
```

**レスポンス**:
```typescript
{
  success: true;
  data: ZohoJob;
}
```

---

## 4. エラーハンドリング

### 4-1. エラーコード

**バリデーションエラー**:
- `VALIDATION_ERROR`: バリデーションエラー
- `REQUIRED_FIELD_MISSING`: 必須フィールドが不足
- `INVALID_VALUE`: 無効な値

**リソースエラー**:
- `NOT_FOUND`: リソースが見つからない
- `ALREADY_EXISTS`: リソースが既に存在
- `CONFLICT`: リソースの競合

**認証・認可エラー**:
- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限がない

**サーバーエラー**:
- `INTERNAL_ERROR`: 内部サーバーエラー
- `SERVICE_UNAVAILABLE`: サービス利用不可

### 4-2. エラーレスポンス例

**バリデーションエラー**:
```typescript
{
  success: false;
  error: {
    code: "VALIDATION_ERROR";
    message: "バリデーションエラーが発生しました";
    details: {
      mileage: "走行距離は0以上である必要があります";
      serviceKind: "入庫区分は必須です";
    };
  };
}
```

**リソースが見つからない**:
```typescript
{
  success: false;
  error: {
    code: "NOT_FOUND";
    message: "Job abc123 が見つかりません";
  };
}
```

---

## 5. 認証・認可

### 5-1. 認証方式

**現状**: 認証は未実装（MVP）

**将来実装**:
- JWT (JSON Web Token) を使用
- トークンはHTTPヘッダーで送信: `Authorization: Bearer {token}`

### 5-2. 認可

**ロールベースアクセス制御**:
- `admin`: 管理者（すべての操作が可能）
- `front`: フロントスタッフ（受付、見積作成）
- `mechanic`: 整備士（診断、作業）
- `customer`: 顧客（承認、レポート確認）

---

## 6. パフォーマンス最適化

### 6-1. キャッシング

**SWRを使用したキャッシング**:
```typescript
const { data, error, mutate } = useSWR(
  `/api/jobs/${jobId}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  }
);
```

### 6-2. ページネーション

**ページネーション対応エンドポイント**:
```
GET /api/jobs?page=1&limit=20
```

**レスポンス**:
```typescript
{
  success: true;
  data: {
    items: ZohoJob[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### 6-3. フィルタリング・ソート

**フィルタリング**:
```
GET /api/jobs?status=診断中&serviceKind=車検
```

**ソート**:
```
GET /api/jobs?sort=createdAt&order=desc
```

---

## 7. API実装例

### 7-1. クライアント実装

**APIクライアント関数**:
```typescript
// src/lib/api.ts
export async function fetchJobById(id: string): Promise<ApiResponse<ZohoJob>> {
  const response = await fetch(`/api/jobs/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.error,
    };
  }
  
  const data = await response.json();
  return {
    success: true,
    data: data.data,
  };
}

export async function saveDiagnosisData(
  jobId: string,
  workOrderId: string,
  diagnosisData: DiagnosisData
): Promise<ApiResponse<WorkOrder>> {
  const response = await fetch(
    `/api/jobs/${jobId}/work-orders/${workOrderId}/diagnosis`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diagnosisData),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.error,
    };
  }
  
  const data = await response.json();
  return {
    success: true,
    data: data.data,
  };
}
```

### 7-2. エラーハンドリング

**エラーハンドリング関数**:
```typescript
export function handleApiError(error: ApiError): void {
  switch (error.code) {
    case "VALIDATION_ERROR":
      toast.error("入力内容に誤りがあります");
      break;
    case "NOT_FOUND":
      toast.error("リソースが見つかりません");
      break;
    case "UNAUTHORIZED":
      toast.error("認証が必要です");
      break;
    default:
      toast.error(error.message || "エラーが発生しました");
  }
}
```

---

## 8. 更新履歴

- 2025-01-XX: 初版作成

---

## 9. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [データモデル統合](./DATA_MODEL_INTEGRATION.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

































