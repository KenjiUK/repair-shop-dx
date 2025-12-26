# 実装ガイド

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: 開発者向け実装ガイド
- **設計方針**: 実装可能な形で詳細に説明

---

## 1. 開発環境のセットアップ

### 1-1. 前提条件

**必要な環境**:
- Node.js 20以上
- npm / yarn / pnpm / bun
- Git

### 1-2. セットアップ手順

**1. リポジトリのクローン**:
```bash
git clone <repository-url>
cd repair-shop-dx
```

**2. 依存関係のインストール**:
```bash
npm install
```

**3. 環境変数の設定**:
```bash
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定
```

**4. 開発サーバーの起動**:
```bash
npm run dev
```

**5. ブラウザで確認**:
```
http://localhost:3000
```

### 1-3. 開発ツール

**推奨エディタ**:
- VS Code
- Cursor

**推奨拡張機能**:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript

---

## 2. プロジェクト構成

### 2-1. ディレクトリ構造

```
src/
├── app/                    # Next.js App Router ページ
│   ├── page.tsx           # TOP (受付画面)
│   ├── mechanic/          # 整備士向け画面
│   │   ├── diagnosis/    # 診断画面
│   │   └── work/          # 作業画面
│   ├── admin/             # 事務所向け画面
│   │   ├── reception/     # 受付画面
│   │   └── estimate/      # 見積画面
│   └── customer/          # 顧客向け画面
│       ├── approval/      # 承認画面
│       └── report/        # レポート画面
├── components/
│   ├── common/            # 共通コンポーネント
│   │   ├── page-layout.tsx
│   │   ├── vehicle-info-card.tsx
│   │   ├── reception-form.tsx
│   │   ├── diagnosis-form.tsx
│   │   ├── estimate-form.tsx
│   │   ├── work-form.tsx
│   │   └── handover-form.tsx
│   ├── features/          # 機能コンポーネント
│   │   ├── job-card.tsx
│   │   ├── today-summary-card.tsx
│   │   └── ...
│   └── ui/                # UI基本コンポーネント (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── api.ts             # APIクライアント (Zoho CRM連携)
│   ├── compress.ts         # 画像圧縮ユーティリティ
│   └── utils.ts           # 汎用ユーティリティ
└── types/
    └── index.ts           # TypeScript型定義
```

### 2-2. ファイル命名規則

**コンポーネント**:
- PascalCase: `ReceptionForm.tsx`
- ファイル名とコンポーネント名は一致

**ユーティリティ**:
- camelCase: `compress.ts`, `utils.ts`

**ページ**:
- Next.js App Routerの規則に従う: `page.tsx`

---

## 3. コンポーネントの実装

### 3-1. 共通コンポーネントの実装

**例: ReceptionForm**:
```typescript
// src/components/common/reception-form.tsx
"use client";

import { VehicleInfoCard } from "./vehicle-info-card";
import { FormField } from "@/components/ui/form-field";
import { NumberInput } from "@/components/ui/number-input";
import { TextArea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";

interface ReceptionFormProps {
  vehicle: Vehicle;
  mileage: number;
  onMileageChange: (mileage: number) => void;
  previousHistory?: Job[];
  notes?: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
}

export function ReceptionForm({
  vehicle,
  mileage,
  onMileageChange,
  previousHistory,
  notes,
  onNotesChange,
  onSubmit,
  children,
}: ReceptionFormProps) {
  return (
    <div className="space-y-6">
      <VehicleInfoCard vehicle={vehicle} />
      
      <FormField label="走行距離" required>
        <NumberInput
          value={mileage}
          onChange={onMileageChange}
          unit="km"
        />
      </FormField>
      
      {previousHistory && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">前回履歴</h3>
          {previousHistory.map((job) => (
            <div key={job.id} className="text-sm text-slate-600">
              {job.date}: {job.serviceKind}
            </div>
          ))}
        </div>
      )}
      
      {children}
      
      <FormField label="備考">
        <TextArea
          value={notes || ""}
          onChange={onNotesChange}
          rows={3}
        />
      </FormField>
      
      <div className="flex justify-end">
        <Button onClick={onSubmit}>
          入庫確定
        </Button>
      </div>
    </div>
  );
}
```

### 3-2. 拡張コンポーネントの実装

**例: AccidentInfoSection**:
```typescript
// src/components/features/body-paint/accident-info-section.tsx
"use client";

import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AccidentInfoSectionProps {
  accident: AccidentInfo;
  onChange: (accident: AccidentInfo) => void;
}

export function AccidentInfoSection({
  accident,
  onChange,
}: AccidentInfoSectionProps) {
  const handleChange = (field: keyof AccidentInfo, value: any) => {
    onChange({
      ...accident,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <FormField label="事故案件情報">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={accident.isAccident}
              onCheckedChange={(checked) =>
                handleChange("isAccident", checked)
              }
            />
            <label>事故案件</label>
          </div>
          
          {accident.isAccident && (
            <>
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={accident.isTowTruck}
                  onCheckedChange={(checked) =>
                    handleChange("isTowTruck", checked)
                  }
                />
                <label>レッカー入庫</label>
              </div>
              
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={accident.hasInsurance}
                  onCheckedChange={(checked) =>
                    handleChange("hasInsurance", checked)
                  }
                />
                <label>保険対応あり</label>
              </div>
              
              {accident.hasInsurance && (
                <FormField label="保険会社名" required>
                  <Input
                    value={accident.insuranceCompany || ""}
                    onChange={(e) =>
                      handleChange("insuranceCompany", e.target.value)
                    }
                  />
                </FormField>
              )}
              
              <FormField label="事故の程度">
                <Select
                  value={accident.severity || ""}
                  onChange={(value) => handleChange("severity", value)}
                  options={[
                    { value: "軽微", label: "軽微" },
                    { value: "中程度", label: "中程度" },
                    { value: "深刻", label: "深刻" },
                    { value: "全損", label: "全損" },
                  ]}
                />
              </FormField>
            </>
          )}
        </div>
      </FormField>
    </div>
  );
}
```

### 3-3. ページの実装

**例: 受付画面**:
```typescript
// src/app/admin/reception/[id]/page.tsx
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ReceptionForm } from "@/components/common/reception-form";
import { AccidentInfoSection } from "@/components/features/body-paint/accident-info-section";
import { fetchJobById, saveReceptionData } from "@/lib/api";
import { toast } from "sonner";

export default function ReceptionPage() {
  const params = useMemo(() => useParams(), []);
  const jobId = params.id as string;
  
  const { data: job, mutate } = useSWR(
    jobId ? `/api/jobs/${jobId}` : null,
    () => fetchJobById(jobId)
  );
  
  const [mileage, setMileage] = useState(job?.data?.field10 || 0);
  const [accident, setAccident] = useState<AccidentInfo>({
    isAccident: false,
    isTowTruck: false,
    hasInsurance: false,
  });
  
  const handleSubmit = async () => {
    const result = await saveReceptionData(jobId, {
      mileage,
      accident,
    });
    
    if (result.success) {
      toast.success("受付情報を保存しました");
      mutate();
    } else {
      toast.error(result.error?.message || "エラーが発生しました");
    }
  };
  
  if (!job?.data) {
    return <div>読み込み中...</div>;
  }
  
  return (
    <ReceptionForm
      vehicle={job.data.vehicle}
      mileage={mileage}
      onMileageChange={setMileage}
      previousHistory={previousHistory}
      onSubmit={handleSubmit}
    >
      {job.data.serviceKind === "板金・塗装" && (
        <AccidentInfoSection
          accident={accident}
          onChange={setAccident}
        />
      )}
    </ReceptionForm>
  );
}
```

---

## 4. データモデルの使用

### 4-1. 型定義の使用

**基本Jobモデル**:
```typescript
import { BaseJob, WorkOrder } from "@/types";

const job: BaseJob = {
  jobId: "123",
  serviceKind: "車検",
  serviceKinds: ["車検"],
  vehicle: {
    vehicleId: "V001",
    mileage: 25000,
  },
  status: "診断中",
  workOrders: [],
};
```

**入庫区分別の拡張**:
```typescript
import { VehicleInspectionJob } from "@/types";

const inspectionJob: VehicleInspectionJob = {
  ...baseJob,
  serviceKind: "車検",
  workOrders: [
    {
      id: "wo-001",
      serviceKind: "車検",
      status: "診断中",
      diagnosis: {
        inspectionResults: [],
        measurements: [],
        photos: [],
        comments: "",
      },
    },
  ],
};
```

### 4-2. データ変換

**Zoho Job → BaseJob**:
```typescript
import { convertZohoJobToBaseJob } from "@/lib/data-converter";

const zohoJob = await fetchJobById(jobId);
const baseJob = convertZohoJobToBaseJob(zohoJob.data);
```

---

## 5. APIの使用

### 5-1. APIクライアントの使用

**データ取得**:
```typescript
import { fetchJobById } from "@/lib/api";
import useSWR from "swr";

const { data, error, mutate } = useSWR(
  `/api/jobs/${jobId}`,
  () => fetchJobById(jobId)
);
```

**データ保存**:
```typescript
import { saveDiagnosisData } from "@/lib/api";
import { toast } from "sonner";

const handleSave = async () => {
  const result = await saveDiagnosisData(jobId, workOrderId, diagnosisData);
  
  if (result.success) {
    toast.success("保存しました");
    mutate();
  } else {
    toast.error(result.error?.message || "エラーが発生しました");
  }
};
```

### 5-2. エラーハンドリング

**エラーハンドリング関数**:
```typescript
import { handleApiError } from "@/lib/api-utils";

const result = await saveData(data);
if (!result.success) {
  handleApiError(result.error);
}
```

---

## 6. テスト

### 6-1. ユニットテスト

**コンポーネントテスト**:
```typescript
// __tests__/components/reception-form.test.tsx
import { render, screen } from "@testing-library/react";
import { ReceptionForm } from "@/components/common/reception-form";

describe("ReceptionForm", () => {
  it("renders vehicle information", () => {
    render(
      <ReceptionForm
        vehicle={{
          vehicleId: "V001",
          licensePlate: "堺 330 す 1669",
        }}
        mileage={25000}
        onMileageChange={() => {}}
        onSubmit={() => {}}
      />
    );
    
    expect(screen.getByText("堺 330 す 1669")).toBeInTheDocument();
  });
});
```

### 6-2. 統合テスト

**APIテスト**:
```typescript
// __tests__/api/jobs.test.ts
import { fetchJobById } from "@/lib/api";

describe("fetchJobById", () => {
  it("returns job data", async () => {
    const result = await fetchJobById("123");
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("jobId");
  });
});
```

---

## 7. デバッグ

### 7-1. 開発ツール

**React DevTools**:
- コンポーネントの状態を確認
- プロップスの値を確認

**ブラウザ DevTools**:
- ネットワークタブ: APIリクエストを確認
- コンソール: エラーログを確認

### 7-2. ログ出力

**デバッグログ**:
```typescript
console.log("[DEBUG] Job data:", job);
console.log("[DEBUG] Work orders:", workOrders);
```

**エラーログ**:
```typescript
console.error("[ERROR] Failed to save:", error);
```

---

## 8. パフォーマンス最適化

### 8-1. 画像圧縮

**実装例**:
```typescript
import imageCompression from "browser-image-compression";

async function handleImageUpload(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  const compressedFile = await imageCompression(file, options);
  return compressedFile;
}
```

### 8-2. データキャッシング

**SWR設定**:
```typescript
const { data } = useSWR(
  `/api/jobs/${jobId}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  }
);
```

### 8-3. コード分割

**動的インポート**:
```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./heavy-component"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

## 9. デプロイ

### 9-1. ビルド

**本番ビルド**:
```bash
npm run build
```

### 9-2. 本番サーバー起動

**本番サーバー**:
```bash
npm start
```

### 9-3. Vercelデプロイ

**Vercel CLI**:
```bash
vercel deploy
```

---

## 10. トラブルシューティング

### 10-1. よくある問題

**問題1: 型エラー**:
- 解決策: `src/types/index.ts`で型定義を確認

**問題2: APIエラー**:
- 解決策: ネットワークタブでリクエストを確認

**問題3: スタイルが適用されない**:
- 解決策: Tailwind CSSのクラス名を確認

### 10-2. デバッグ手順

1. ブラウザのコンソールでエラーを確認
2. ネットワークタブでAPIリクエストを確認
3. React DevToolsでコンポーネントの状態を確認
4. ログ出力を追加してデータフローを確認

---

## 11. 更新履歴

- 2025-01-XX: 初版作成

---

## 12. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md)
- [データモデル統合](./DATA_MODEL_INTEGRATION.md)
- [API設計統一](./API_DESIGN_UNIFIED.md)
- [UI/UXガイドライン](./UI_UX_GUIDELINES.md)
- [入庫区分別統合仕様書](./SERVICE_KIND_INTEGRATION_GUIDE.md)

































