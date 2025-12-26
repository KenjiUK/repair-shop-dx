# 技術スタックとファイル構造仕様

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: システム全体の技術スタックとGoogle Driveのファイル構造・命名規則

---

## 1. 技術スタック

### 1-1. フロントエンド

| **項目** | **技術** | **バージョン/詳細** | **用途** |
| --- | --- | --- | --- |
| Framework | Next.js | 16 (App Router) | サーバーサイドレンダリング、API Routes |
| Language | TypeScript | Strict mode | 型安全性の確保 |
| Styling | Tailwind CSS | 4 | ユーティリティファーストのCSS |
| UI Library | shadcn/ui | Radix UIベース | アクセシブルなUIコンポーネント |
| State Management | SWR | - | データフェッチングとキャッシング |
| Icons | lucide-react | - | アイコンライブラリ |

### 1-2. 外部システム連携

| **システム** | **用途** | **アクセス権限** | **備考** |
| --- | --- | --- | --- |
| Zoho CRM | Transaction Hub（入庫管理、顧客管理、車両管理） | Read / Write（制約あり） | 基幹システムとの連携ハブ<br>**⚠️ 制約**: マスタデータ（顧客・車両）の追加・編集・削除は絶対にしない |
| Google Sheets | Master Data Cache（車両マスタ、顧客マスタ） | **Read Only（絶対に編集禁止）** | マスタデータのキャッシュ<br>**⚠️ 制約**: 追加・編集・削除は絶対にしない |
| Google Drive | File Storage（写真、動画、PDF、JSON） | Read / Write | ファイルストレージ |
| Google Apps Script (GAS) | マスタデータ同期（CSV/Excel → Google Sheets） | - | 自動化スクリプト |

### 1-3. データベース・ストレージ

| **種別** | **技術** | **用途** | **備考** |
| --- | --- | --- | --- |
| マスタデータ | Google Sheets | 車両マスタ、顧客マスタ | 基幹システムから毎日更新<br>**⚠️ 制約**: アプリから追加・編集・削除は絶対にしない（読み取り専用） |
| スマートタグ管理 | Google Sheets | Tags、Sessionsシート | 物理タグとJobの紐付け管理 |
| ファイルストレージ | Google Drive | 写真、動画、PDF、JSON | 容量制限なし（無料プラン） |
| ローカルストレージ | IndexedDB / LocalStorage | オフライン時のデータ永続化 | ブラウザ内ストレージ |

### 1-4. インフラ

| **項目** | **技術** | **備考** |
| --- | --- | --- |
| ホスティング | Vercel | Next.jsの推奨ホスティング |
| 認証 | セッションベース認証（MVP） | 将来はJWT対応予定 |
| タイムゾーン | JST (Asia/Tokyo) | すべての日時は日本時間で処理 |

---

## 2. Google Driveのフォルダ構造

### 2-1. ルート構造

```
/repair-shop-dx/
  ├── /master-data/                    # マスタデータCSV/Excelのアップロード先
  ├── /customers/                      # 顧客別フォルダ
  │   └── /{customerId}_{customerName}/  # 顧客ID_顧客名
  │       └── /vehicles/                 # 車両フォルダ
  │           └── /{vehicleId}_{vehicleName}/  # 車両ID_車両名
  │               ├── /documents/        # 車両関連書類
  │               │   ├── shaken_{vehicleId}_{日付}.pdf  # 車検証（最新版）
  │               │   └── shaken_history/  # 車検証履歴（過去の車検証も保存）
  │               └── /jobs/              # 来店履歴（Job）
  │                   └── /{jobDate}_{jobId}/  # 入庫日_JobID
  │                       ├── /wo-{workOrderId}/  # ワークオーダー
  │                       │   ├── diagnosis.json
  │                       │   ├── estimate.json
  │                       │   ├── work.json
  │                       │   ├── /photos/        # 作業記録用写真（元データ）
  │                       │   └── /videos/
  │                       └── invoice.pdf  # 統合請求書（Job全体）
  └── /blog-photos/                    # ブログ用写真フォルダ
      ├── /by-date/                    # 日付別
      │   └── /YYYYMM/                 # 年月別
      │       └── /YYYYMMDD/           # 日付別
      ├── /by-service/                 # 作業種類別
      │   ├── /車検/
      │   ├── /12ヵ月点検/
      │   ├── /オイル交換/
      │   └── ...
      ├── /by-vehicle-type/            # 車種別
      │   ├── /BMW/
      │   ├── /メルセデス/
      │   └── ...
      └── /before-after/               # Before/After別
          ├── /before/
          └── /after/
```

### 2-2. フォルダ詳細

#### 2-2-1. `/repair-shop-dx/master-data/`

**用途**: 基幹システム（スマートカーディーラー）から出力されたCSV/Excelファイルのアップロード先

**ファイル命名規則**:
- 車両マスタ: `車両マスタ_YYYYMMDD.csv` または `車両マスタ_YYYYMMDD.xlsx`
- 顧客マスタ: `顧客マスタ_YYYYMMDD.csv` または `顧客マスタ_YYYYMMDD.xlsx`

**処理フロー**:
1. 事務員が基幹システムからCSV/Excelを出力
2. このフォルダにアップロード
3. GAS（Google Apps Script）が自動検知
4. Google Sheetsに変換・上書き

**共有設定**: 事務員がアップロードできるよう共有設定（読み書き可能）

#### 2-2-2. `/repair-shop-dx/customers/{customerId}_{customerName}/`

**用途**: 顧客別のフォルダ。同じ顧客のすべての来店履歴を集約

**顧客IDの形式**: 基幹システムの顧客ID（例: `K1001`）

**フォルダ構造**:
```
/customers/{customerId}_{customerName}/
  └── /vehicles/  # 車両フォルダ
```

#### 2-2-3. `/repair-shop-dx/customers/.../vehicles/{vehicleId}_{vehicleName}/`

**用途**: 車両別のフォルダ。同じ車両のすべての来店履歴を集約

**車両IDの形式**: 基幹システムの車両ID（例: `V001`）

**フォルダ構造**:
```
/vehicles/{vehicleId}_{vehicleName}/
  ├── /documents/        # 車両関連書類
  │   ├── shaken_{vehicleId}_{日付}.pdf  # 車検証（最新版）
  │   └── shaken_history/  # 車検証履歴
  └── /jobs/              # 来店履歴（Job）
```

#### 2-2-4. `/repair-shop-dx/customers/.../vehicles/.../documents/`

**用途**: 車両関連書類（車検証など）を保存

**ファイル構成**:

| **ファイル名** | **形式** | **内容** | **備考** |
| --- | --- | --- | --- |
| `shaken_{vehicleId}_{日付}.pdf` | PDF | 車検証（最新版） | 常に最新の車検証を参照可能 |
| `shaken_history/shaken_{vehicleId}_{日付}.pdf` | PDF | 車検証（履歴） | 過去の車検証を保持 |

**車検証の管理**:
- 最新版は`/documents/`直下に保存
- 新しい車検証がアップロードされたら、既存の最新版を`shaken_history/`に移動
- 以降の来店時は、`/documents/`から最新の車検証を参照

#### 2-2-5. `/repair-shop-dx/customers/.../vehicles/.../jobs/{jobDate}_{jobId}/`

**用途**: 各Job（入庫案件）の詳細データを格納

**Job IDの形式**: Zoho CRM CustomModule2.id（例: `1234567890123456789`）
**Job Dateの形式**: 入庫日（YYYYMMDD形式、例: `20250115`）

**フォルダ構造**:
```
/jobs/{jobDate}_{jobId}/
  ├── /wo-{workOrderId}/     # ワークオーダーごとのフォルダ
  │   ├── diagnosis.json
  │   ├── estimate.json
  │   ├── work.json
  │   ├── /photos/           # 作業記録用写真（元データ）
  │   └── /videos/
  └── invoice.pdf             # 統合請求書PDF（Job全体）
```

#### 2-2-6. `/repair-shop-dx/customers/.../vehicles/.../jobs/.../wo-{workOrderId}/`

**用途**: 各ワークオーダー（作業）の詳細データを格納

**Work Order IDの形式**: `wo-001`, `wo-002`, ...（連番）

**ファイル構成**:

| **ファイル名** | **形式** | **内容** | **サイズ目安** |
| --- | --- | --- | --- |
| `diagnosis.json` | JSON | 診断詳細（検査項目、測定値、コメント） | 10-50KB |
| `estimate.json` | JSON | 見積詳細（部品リスト、工賃、合計金額） | 5-20KB |
| `work.json` | JSON | 作業詳細（作業記録、時間、整備士名） | 5-15KB |

**フォルダ構成**:

| **フォルダ名** | **用途** | **ファイル命名規則** |
| --- | --- | --- |
| `/photos/` | 診断・作業時の写真 | `before_{連番}.jpg`, `after_{連番}.jpg`, `diagnosis_{連番}.jpg` |
| `/videos/` | 診断・作業時の動画 | `diagnosis_{連番}.mp4`, `work_{連番}.mp4` |

#### 2-2-7. `/repair-shop-dx/blog-photos/`

**用途**: ブログ担当者が記事に使用する写真を分類して保存

**分類方法**:
- **日付別**: `/by-date/YYYYMM/YYYYMMDD/`
- **作業種類別**: `/by-service/{作業種類}/`
- **車種別**: `/by-vehicle-type/{メーカー}/`
- **Before/After別**: `/before-after/{種類}/`

**ファイル命名規則**: `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}`
- 例: `20250115_BMW_X3_車検_before_001.jpg`

**注意**: ブログ用写真は元の写真をコピーして保存します。元の写真は作業記録として残します。

---

## 3. ファイル命名規則

### 3-1. JSONファイル

#### 3-1-1. `diagnosis.json`

**構造**:
```json
{
  "workOrderId": "wo-001",
  "serviceKind": "車検",
  "status": "完了",
  "inspections": [
    {
      "category": "エンジン",
      "items": [
        {
          "name": "エンジンオイル",
          "result": "正常",
          "measurement": "5.2L",
          "photoUrl": "https://drive.google.com/file/d/xxx/before_001.jpg",
          "comment": "オイルレベル正常"
        }
      ]
    }
  ],
  "videos": [
    {
      "url": "https://drive.google.com/file/d/xxx/diagnosis_001.mp4",
      "description": "エンジン音の確認"
    }
  ],
  "createdAt": "2025-01-15T10:30:00+09:00",
  "updatedAt": "2025-01-15T11:00:00+09:00"
}
```

#### 3-1-2. `estimate.json`

**構造**:
```json
{
  "workOrderId": "wo-001",
  "serviceKind": "車検",
  "status": "承認済み",
  "items": [
    {
      "name": "エンジンオイル交換",
      "quantity": 1,
      "unitPrice": 5000,
      "totalPrice": 5000,
      "category": "部品"
    }
  ],
  "laborCost": 50000,
  "totalCost": 55000,
  "baseSystemItemId": "INV-2025-001-1",
  "createdAt": "2025-01-15T11:00:00+09:00",
  "updatedAt": "2025-01-15T11:30:00+09:00"
}
```

#### 3-1-3. `work.json`

**構造**:
```json
{
  "workOrderId": "wo-001",
  "serviceKind": "車検",
  "status": "完了",
  "mechanicName": "山田 太郎",
  "workRecords": [
    {
      "time": "2025-01-15T13:00:00+09:00",
      "content": "エンジンオイル交換完了",
      "photoUrl": "https://drive.google.com/file/d/xxx/after_001.jpg"
    }
  ],
  "startedAt": "2025-01-15T12:00:00+09:00",
  "completedAt": "2025-01-15T14:00:00+09:00",
  "createdAt": "2025-01-15T12:00:00+09:00",
  "updatedAt": "2025-01-15T14:00:00+09:00"
}
```

### 3-2. 画像ファイル

#### 3-2-1. 写真ファイル

**命名規則**: `{種類}_{連番}.{拡張子}`

| **種類** | **命名例** | **用途** |
| --- | --- | --- |
| Before | `before_001.jpg`, `before_002.jpg` | 作業前の状態 |
| After | `after_001.jpg`, `after_002.jpg` | 作業後の状態 |
| Diagnosis | `diagnosis_001.jpg`, `diagnosis_002.jpg` | 診断時の写真 |
| Work | `work_001.jpg`, `work_002.jpg` | 作業中の写真 |

**拡張子**: `.jpg`, `.jpeg`, `.png`, `.webp`

**サイズ制限**: 
- アップロード前: 最大5MB
- アップロード後（圧縮後）: 最大500KB

**圧縮**: クライアント側で`browser-image-compression`を使用して自動圧縮

#### 3-2-2. 動画ファイル

**命名規則**: `{種類}_{連番}.{拡張子}`

| **種類** | **命名例** | **用途** |
| --- | --- | --- |
| Diagnosis | `diagnosis_001.mp4`, `diagnosis_002.mp4` | 診断時の動画 |
| Work | `work_001.mp4`, `work_002.mp4` | 作業中の動画 |

**拡張子**: `.mp4`, `.mov`, `.webm`

**サイズ制限**: 最大15秒、最大10MB

### 3-3. PDFファイル

#### 3-3-1. 車検証

**命名規則**: `shaken_{vehicleId}_{受付日}.{拡張子}`

**命名例**:
- `shaken_V001_20250115.pdf`

**保存場所**: 
- 最新版: `/customers/{customerId}/vehicles/{vehicleId}/documents/shaken_{vehicleId}_{日付}.pdf`
- 履歴: `/customers/{customerId}/vehicles/{vehicleId}/documents/shaken_history/shaken_{vehicleId}_{日付}.pdf`

**管理方法**:
- 新しい車検証がアップロードされたら、既存の最新版を`shaken_history/`に移動
- 最新版は常に`/documents/`直下に保存（参照しやすくする）
- Zoho CRMの`field12`（関連ファイル）には最新版のURLを保存

#### 3-3-2. 請求書PDF

**命名規則**: `invoice.pdf` または `{日付}_{顧客名}_{識別子}.pdf`

**識別子**: ファイル名に以下のいずれかを含める必要がある
- `invoice`
- `seikyu`
- `請求書`

**命名例**:
- `invoice.pdf`
- `20251015_田中様_請求書.pdf`
- `20251015_invoice_田中様.pdf`
- `20251015_seikyu_田中様.pdf`

**保存場所**: `/customers/{customerId}/vehicles/{vehicleId}/jobs/{jobDate}_{jobId}/invoice.pdf`

**検索方法**: ファイル名に「invoice」「seikyu」「請求書」のいずれかを含むものを部分一致で検索

#### 3-3-3. その他のPDF

| **種類** | **命名規則** | **保存場所** | **用途** |
| --- | --- | --- | --- |
| OBD診断結果 | `obd_diagnosis_{workOrderId}.pdf` | `/customers/.../jobs/.../wo-{workOrderId}/` | OBD診断結果PDF（12ヶ月点検） |
| 診断機結果 | `diagnostic_{workOrderId}.pdf` | `/customers/.../jobs/.../wo-{workOrderId}/` | 診断機結果PDF（故障診断、修理・整備） |
| 分解整備記録簿 | `分解整備記録簿_{workOrderId}.pdf` | `/customers/.../jobs/.../wo-{workOrderId}/` | 車検・12ヶ月点検のPDF生成 |
| レストア完了報告書 | `レストア完了報告書_{workOrderId}.pdf` | `/customers/.../jobs/.../wo-{workOrderId}/` | レストアのPDF生成 |

**サイズ制限**: 最大10MB

### 3-4. マスタデータファイル

#### 3-4-1. CSV/Excelファイル

**命名規則**: `{マスタ種類}_{日付}.{拡張子}`

| **マスタ種類** | **命名例** | **保存場所** |
| --- | --- | --- |
| 車両マスタ | `車両マスタ_20250115.csv` | `/repair-shop-dx/master-data/` |
| 顧客マスタ | `顧客マスタ_20250115.xlsx` | `/repair-shop-dx/master-data/` |

**拡張子**: `.csv`（UTF-8またはShift-JIS）, `.xlsx`, `.xls`

**処理**: GASが自動検知し、Google Sheetsに変換

---

## 4. ファイルアクセス権限

### 4-1. Google Driveフォルダの共有設定

| **フォルダ** | **共有設定** | **アクセス権限** |
| --- | --- | --- |
| `/repair-shop-dx/` | アプリと同じGoogleアカウント | 読み書き可能 |
| `/repair-shop-dx/master-data/` | 事務員、アプリ | 読み書き可能（事務員がアップロード） |
| `/repair-shop-dx/customers/` | アプリのみ | 読み書き可能（アプリが自動生成） |
| `/repair-shop-dx/blog-photos/` | ブログ担当者、アプリ | 読み書き可能（ブログ担当者が参照） |

### 4-2. Google Sheetsの共有設定

| **スプレッドシート** | **共有設定** | **アクセス権限** | **制約** |
| --- | --- | --- | --- |
| `整備工場DX_マスタデータ` | アプリと同じGoogleアカウント | **読み取り専用** | **⚠️ 追加・編集・削除は絶対にしない** |
| `スマートタグ管理` | アプリと同じGoogleアカウント | 読み書き可能 | アプリが管理（タグの紐付け・解放） |

---

## 5. ファイルサイズ制限

| **ファイル種別** | **最大サイズ** | **備考** |
| --- | --- | --- |
| 画像（アップロード前） | 5MB | クライアント側で圧縮 |
| 画像（アップロード後） | 500KB | 圧縮後のサイズ |
| 動画 | 10MB | 最大15秒 |
| PDF | 10MB | 請求書、診断結果など |
| JSON | 制限なし | Google Driveの容量制限内 |

---

## 6. ファイル検索ルール

### 6-1. 請求書PDFの検索

**検索条件**: ファイル名に以下のいずれかを含む
- `invoice`
- `seikyu`
- `請求書`

**検索場所**: `/repair-shop-dx/customers/{customerId}/vehicles/{vehicleId}/jobs/{jobDate}_{jobId}/`

**検索方法**: 部分一致検索（大文字小文字を区別しない）

### 6-2. 車検証の検索

**検索条件**: 車両IDと日付で検索

**検索場所**: `/repair-shop-dx/customers/{customerId}/vehicles/{vehicleId}/documents/`

**検索方法**: 
- 最新版: `/documents/shaken_{vehicleId}_*.pdf`で検索
- 履歴: `/documents/shaken_history/shaken_{vehicleId}_*.pdf`で検索

### 6-3. 写真・動画の検索

**検索条件**: ワークオーダーIDと種類で検索

**検索場所**: `/repair-shop-dx/customers/{customerId}/vehicles/{vehicleId}/jobs/{jobDate}_{jobId}/wo-{workOrderId}/photos/` または `/videos/`

**検索方法**: ファイル名のプレフィックスで検索（例: `before_*`, `after_*`, `diagnosis_*`）

### 6-4. ブログ用写真の検索

**検索条件**: 目的に応じて分類フォルダから検索

**検索場所**: 
- 日付で探す: `/repair-shop-dx/blog-photos/by-date/YYYYMM/YYYYMMDD/`
- 作業種類で探す: `/repair-shop-dx/blog-photos/by-service/{作業種類}/`
- 車種で探す: `/repair-shop-dx/blog-photos/by-vehicle-type/{メーカー}/`
- Before/Afterで探す: `/repair-shop-dx/blog-photos/before-after/{種類}/`

**検索方法**: ファイル名から内容を確認（例: `20250115_BMW_X3_車検_after_001.jpg`）

---

## 7. ファイル管理のベストプラクティス

### 7-1. ファイル命名の原則

1. **一意性**: 同じフォルダ内でファイル名が重複しないようにする
2. **可読性**: ファイル名から内容が推測できるようにする
3. **検索性**: 検索しやすい命名規則を守る
4. **拡張性**: 将来的な拡張に対応できる命名規則にする

### 7-2. フォルダ構造の原則

1. **階層化**: 顧客 → 車両 → Job → Work Order ID の階層で管理
2. **分離**: 種類ごと（JSON、写真、動画、PDF）にフォルダを分ける
3. **一貫性**: すべての顧客・車両・Jobで同じ構造を維持する
4. **車両関連書類**: 車検証などは車両フォルダの`/documents/`に保存
5. **ブログ用写真**: 作業記録とは別に、ブログ用フォルダに分類して保存

### 7-3. セキュリティ

1. **アクセス制御**: 適切な共有設定を維持する
2. **ファイル名のサニタイズ**: 特殊文字、パストラバーサル攻撃を防止
3. **バックアップ**: 重要なファイルは定期的にバックアップを取る

---

## 8. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md): システム全体の統合仕様
- [実装ロードマップ](./ROADMAP.md): 実装優先順位とスケジュール
- [API設計](./API_DESIGN_UNIFIED.md): 統一API設計
- [フォルダ構造再設計提案](./FOLDER_STRUCTURE_PROPOSAL.md): Google Driveフォルダ構造の詳細設計と提案

---

## 9. データアクセス制約

### 9-1. Google Sheets（マスタデータ）の制約

**⚠️ 重要**: アプリからGoogle Sheets（マスタデータ）への**追加・編集・削除は絶対にしない**

**対象スプレッドシート**:
- `整備工場DX_マスタデータ`（車両マスタ、顧客マスタ）

**実装時の注意**:
- Google Sheets APIの読み取りメソッドのみ使用
- 書き込みメソッド（`spreadsheets.values.update`, `spreadsheets.batchUpdate`など）は使用しない
- マスタデータの更新は基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ

### 9-2. Zoho CRM（マスタデータモジュール）の制約

**⚠️ 重要**: アプリからZoho CRMのマスタデータモジュールへの**追加・編集・削除は絶対にしない**

**対象モジュール**:
- Contacts（顧客）モジュール: 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）。顧客の追加・削除は禁止。
- CustomModule1（車両）モジュール: **追加・編集・削除は絶対にしない**。読み取り専用として扱う。

**許可された更新**:
- Contactsモジュール: LINE ID、メール同意、誕生日、予約時連絡先のみ
- CustomModule2（入庫管理）: すべてのフィールド（ただし、`field4`（顧客名Lookup）、`field6`（車両ID Lookup）は参照先レコードIDを指定）

**実装時の注意**:
- マスタデータモジュールへの更新処理を実装しない
- バリデーションで更新試行を検出し、エラーメッセージを表示

---

## 更新履歴

- 2025-01-XX: 初版作成
- 2025-01-XX: マスタデータ保護制約を追加


























