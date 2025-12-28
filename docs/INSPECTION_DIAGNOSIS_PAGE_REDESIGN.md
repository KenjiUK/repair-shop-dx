# 12ヶ月点検・24ヶ月点検 診断画面 再設計仕様書

**作成日**: 2025-01-XX  
**バージョン**: 2.0  
**目的**: 入力効率と視認性を重視した診断画面の再設計。最終的にPDFテンプレートに数値を反映してプレビュー・印刷

---

## 目次

1. [設計方針](#設計方針)
2. [12ヶ月点検 詳細設計](#12ヶ月点検-詳細設計)
3. [24ヶ月点検 詳細設計](#24ヶ月点検-詳細設計)
4. [共通機能](#共通機能)
5. [データモデル](#データモデル)
6. [PDF生成・プレビュー](#pdf生成プレビュー)
7. [実装優先順位](#実装優先順位)

---

## 設計方針

### 1. 基本原則

1. **入力効率の最大化**: 「全項目良好」ボタンで一括設定し、異常箇所のみ編集
2. **親指最適化**: 頻繁に使用する「良好（レ）」を右下に巨大配置
3. **オート進捗**: 判定ボタンを押した瞬間に次の項目へ自動スクロール＆フォーカス
4. **視認性の向上**: フォントサイズを大きくし、コントラストを調整
5. **フィードバック**: タップ時に振動（対応端末のみ）で確実に入力されたことを伝える

### 2. 画面構成

```
┌─────────────────────────────────────┐
│ ヘッダー（車両情報、進捗バー）        │
├─────────────────────────────────────┤
│ タブナビゲーション（カテゴリ切り替え）│
├─────────────────────────────────────┤
│                                     │
│  メインエリア（カテゴリ別項目リスト） │
│  - カテゴリごとのカード              │
│  - 「全項目良好」ボタン              │
│  - 各項目の判定ボタン                │
│                                     │
├─────────────────────────────────────┤
│ 固定ボトムナビゲーション             │
│ [レ] [×] [A] [C] [T] [△] [/]      │
│  （親指最適化、巨大ボタン）          │
├─────────────────────────────────────┤
│ 固定フッター（測定値入力、完了）      │
└─────────────────────────────────────┘
```

---

## 12ヶ月点検 詳細設計

### 1. 検査項目の構造

**5つのカテゴリ**:
1. **かじ取り装置（ステアリング）**
2. **制動装置（ブレーキ）**
3. **走行装置**
4. **緩衝装置（サスペンション）**
5. **動力伝達装置（ドライブトレイン）**

### 2. 画面レイアウト

#### 2-1. ヘッダー

```typescript
// ヘッダーコンポーネント
<InspectionHeader>
  {/* 車両情報 */}
  <VehicleInfo>
    <LicensePlate>{vehicle.licensePlate}</LicensePlate>
    <VehicleName>{vehicle.name}</VehicleName>
    <CustomerName>{customer.name}</CustomerName>
  </VehicleInfo>
  
  {/* 進捗バー */}
  <ProgressBar>
    <ProgressText>
      進捗: {completedCount} / {totalCount} 項目
    </ProgressText>
    <ProgressBarVisual 
      value={completedCount} 
      max={totalCount} 
    />
  </ProgressBar>
  
  {/* 要整備リスト（異常項目のみ） */}
  {abnormalItems.length > 0 && (
    <AbnormalItemsBadge count={abnormalItems.length} />
  )}
</InspectionHeader>
```

#### 2-2. タブナビゲーション

```typescript
// タブナビゲーション
<Tabs defaultValue="steering">
  <TabsList className="grid grid-cols-5 gap-2">
    <TabsTrigger value="steering">
      かじ取り装置
      {getCategoryProgress('steering') > 0 && (
        <Badge>{getCategoryProgress('steering')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="brake">
      制動装置
      {getCategoryProgress('brake') > 0 && (
        <Badge>{getCategoryProgress('brake')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="running">
      走行装置
      {getCategoryProgress('running') > 0 && (
        <Badge>{getCategoryProgress('running')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="suspension">
      緩衝装置
      {getCategoryProgress('suspension') > 0 && (
        <Badge>{getCategoryProgress('suspension')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="drivetrain">
      動力伝達装置
      {getCategoryProgress('drivetrain') > 0 && (
        <Badge>{getCategoryProgress('drivetrain')}</Badge>
      )}
    </TabsTrigger>
  </TabsList>
</Tabs>
```

#### 2-3. メインエリア（カテゴリ別項目リスト）

```typescript
// カテゴリコンテンツ
<TabsContent value="steering">
  <div className="space-y-4">
    {/* 「全項目良好」ボタン */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>かじ取り装置（ステアリング）</CardTitle>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSetAllGoodInCategory}
            className="h-12"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            全項目良好（レ）にする
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steeringItems.map((item, index) => (
          <InspectionItemRow
            key={item.id}
            item={item}
            index={index}
            onStatusChange={handleStatusChange}
            onNext={handleAutoScrollToNext}
            isOmitted={item.isOmitted}
          />
        ))}
      </CardContent>
    </Card>
  </div>
</TabsContent>
```

#### 2-4. 検査項目行コンポーネント

```typescript
// InspectionItemRow コンポーネント
interface InspectionItemRowProps {
  item: InspectionItem;
  index: number;
  onStatusChange: (itemId: string, status: InspectionStatus) => void;
  onNext: () => void;
  isOmitted?: boolean;
}

export function InspectionItemRow({
  item,
  index,
  onStatusChange,
  onNext,
  isOmitted,
}: InspectionItemRowProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  
  return (
    <div
      ref={itemRef}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        "hover:bg-slate-50 transition-colors",
        item.status === 'good' && "bg-green-50 border-green-200",
        item.status === 'exchange' && "bg-red-50 border-red-200",
        item.status === 'adjust' && "bg-yellow-50 border-yellow-200",
        isOmitted && "opacity-60"
      )}
      data-item-id={item.id}
      data-item-index={index}
    >
      {/* 項目名 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-slate-900">
            {item.label}
          </span>
          {isOmitted && (
            <Badge variant="outline" className="text-xs">
              省略可能
            </Badge>
          )}
        </div>
        {/* メモがある場合 */}
        {item.note && (
          <p className="text-sm text-slate-600 mt-1">{item.note}</p>
        )}
      </div>
      
      {/* 判定ボタン（モバイルでは非表示、ボトムナビゲーションを使用） */}
      <div className="hidden md:flex gap-2">
        <StatusButton
          status="good"
          active={item.status === 'good'}
          onClick={() => {
            onStatusChange(item.id, 'good');
            onNext();
          }}
        >
          レ
        </StatusButton>
        <StatusButton
          status="exchange"
          active={item.status === 'exchange'}
          onClick={() => {
            onStatusChange(item.id, 'exchange');
            onNext();
          }}
        >
          ×
        </StatusButton>
        {/* 他のステータスボタンも同様 */}
      </div>
    </div>
  );
}
```

#### 2-5. 固定ボトムナビゲーション（親指最適化）

```typescript
// 固定ボトムナビゲーション
<FixedBottomNavigation>
  <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200 shadow-lg">
    {/* 現在選択中の項目表示 */}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-600 truncate">
        {currentItem?.label || "項目を選択してください"}
      </p>
    </div>
    
    {/* 判定ボタン群（親指最適化） */}
    <div className="flex items-center gap-2">
      {/* 良好（レ）- 最大サイズ、右下配置 */}
      <StatusButton
        status="good"
        size="xl"
        active={currentItem?.status === 'good'}
        onClick={() => handleStatusChange('good')}
        className="bg-green-500 hover:bg-green-600 text-white h-16 w-16 rounded-full shadow-lg"
        hapticFeedback
      >
        <span className="text-2xl font-bold">レ</span>
      </StatusButton>
      
      {/* 交換（×）- 中サイズ */}
      <StatusButton
        status="exchange"
        size="lg"
        active={currentItem?.status === 'exchange'}
        onClick={() => handleStatusChange('exchange')}
        className="bg-red-500 hover:bg-red-600 text-white h-14 w-14 rounded-full shadow-md"
        hapticFeedback
      >
        <span className="text-xl font-bold">×</span>
      </StatusButton>
      
      {/* 調整（A）- 中サイズ */}
      <StatusButton
        status="adjust"
        size="lg"
        active={currentItem?.status === 'adjust'}
        onClick={() => handleStatusChange('adjust')}
        className="bg-yellow-500 hover:bg-yellow-600 text-white h-14 w-14 rounded-full shadow-md"
        hapticFeedback
      >
        <span className="text-xl font-bold">A</span>
      </StatusButton>
      
      {/* 清掃（C） */}
      <StatusButton
        status="clean"
        size="md"
        active={currentItem?.status === 'clean'}
        onClick={() => handleStatusChange('clean')}
        className="bg-blue-500 hover:bg-blue-600 text-white h-12 w-12 rounded-full"
        hapticFeedback
      >
        <span className="text-lg font-bold">C</span>
      </StatusButton>
      
      {/* 締付（T） */}
      <StatusButton
        status="tighten"
        size="md"
        active={currentItem?.status === 'tighten'}
        onClick={() => handleStatusChange('tighten')}
        className="bg-purple-500 hover:bg-purple-600 text-white h-12 w-12 rounded-full"
        hapticFeedback
      >
        <span className="text-lg font-bold">T</span>
      </StatusButton>
      
      {/* 修理（△） */}
      <StatusButton
        status="repair"
        size="md"
        active={currentItem?.status === 'repair'}
        onClick={() => handleStatusChange('repair')}
        className="bg-orange-500 hover:bg-orange-600 text-white h-12 w-12 rounded-full"
        hapticFeedback
      >
        <span className="text-lg font-bold">△</span>
      </StatusButton>
      
      {/* 該当なし（/） */}
      <StatusButton
        status="none"
        size="md"
        active={currentItem?.status === 'none'}
        onClick={() => handleStatusChange('none')}
        className="bg-gray-500 hover:bg-gray-600 text-white h-12 w-12 rounded-full"
        hapticFeedback
      >
        <span className="text-lg font-bold">/</span>
      </StatusButton>
    </div>
  </div>
</FixedBottomNavigation>
```

#### 2-6. 測定値入力エリア

```typescript
// 測定値入力セクション
<MeasurementSection>
  <Card>
    <CardHeader>
      <CardTitle>測定値入力</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* CO・HC濃度 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>CO濃度（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={measurements.co}
            onChange={(e) => setMeasurements({ ...measurements, co: parseFloat(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
        <div>
          <Label>HC濃度（ppm）</Label>
          <Input
            type="number"
            step="1"
            value={measurements.hc}
            onChange={(e) => setMeasurements({ ...measurements, hc: parseInt(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
      </div>
      
      {/* ブレーキパッド厚さ */}
      <div>
        <Label>ブレーキパッド、ライニングの厚さ（mm）</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-sm">前輪 左</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.brakeFrontLeft}
              onChange={(e) => setMeasurements({ ...measurements, brakeFrontLeft: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">前輪 右</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.brakeFrontRight}
              onChange={(e) => setMeasurements({ ...measurements, brakeFrontRight: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">後輪 左</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.brakeRearLeft}
              onChange={(e) => setMeasurements({ ...measurements, brakeRearLeft: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">後輪 右</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.brakeRearRight}
              onChange={(e) => setMeasurements({ ...measurements, brakeRearRight: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
        </div>
      </div>
      
      {/* タイヤ溝深さ */}
      <div>
        <Label>タイヤの溝の深さ（mm）</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-sm">前輪 左</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.tireFrontLeft}
              onChange={(e) => setMeasurements({ ...measurements, tireFrontLeft: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">前輪 右</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.tireFrontRight}
              onChange={(e) => setMeasurements({ ...measurements, tireFrontRight: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">後輪 左</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.tireRearLeft}
              onChange={(e) => setMeasurements({ ...measurements, tireRearLeft: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-sm">後輪 右</Label>
            <Input
              type="number"
              step="0.1"
              value={measurements.tireRearRight}
              onChange={(e) => setMeasurements({ ...measurements, tireRearRight: parseFloat(e.target.value) })}
              className="h-12 text-lg"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</MeasurementSection>
```

#### 2-7. 交換部品入力エリア

```typescript
// 交換部品入力セクション
<PartsSection>
  <Card>
    <CardHeader>
      <CardTitle>交換部品等</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>エンジンオイル（L）</Label>
          <Input
            type="number"
            step="0.1"
            value={parts.engineOil}
            onChange={(e) => setParts({ ...parts, engineOil: parseFloat(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
        <div>
          <Label>オイルフィルター</Label>
          <Input
            type="number"
            step="1"
            value={parts.oilFilter}
            onChange={(e) => setParts({ ...parts, oilFilter: parseInt(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
        <div>
          <Label>ワイパーゴム</Label>
          <Input
            type="number"
            step="1"
            value={parts.wiperRubber}
            onChange={(e) => setParts({ ...parts, wiperRubber: parseInt(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
        <div>
          <Label>クリーンエアフィルター</Label>
          <Input
            type="number"
            step="1"
            value={parts.airFilter}
            onChange={(e) => setParts({ ...parts, airFilter: parseInt(e.target.value) })}
            className="h-12 text-lg"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</PartsSection>
```

#### 2-8. 完了ボタンとプレビュー

```typescript
// 固定フッター（完了ボタン）
<FixedFooter>
  <div className="flex items-center gap-4 px-4 py-4 bg-white border-t border-slate-200 shadow-lg">
    <Button
      variant="outline"
      size="lg"
      onClick={handleSaveDraft}
      className="h-12"
    >
      一時保存
    </Button>
    <Button
      size="lg"
      onClick={handlePreviewPDF}
      disabled={!isAllItemsCompleted}
      className="flex-1 h-12"
    >
      <FileText className="h-5 w-5 mr-2" />
      PDFプレビュー
    </Button>
    <Button
      size="lg"
      onClick={handleComplete}
      disabled={!isAllItemsCompleted}
      className="h-12"
    >
      完了
    </Button>
  </div>
</FixedFooter>
```

### 3. 12ヶ月点検の検査項目リスト

#### 3-1. かじ取り装置（ステアリング）

```typescript
const steeringItems: InspectionItem[] = [
  {
    id: 'steering-001',
    label: 'パワーステアリングのベルトの緩み、損傷',
    category: 'steering',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'steering-002',
    label: 'パワーステアリングのオイルの漏れ',
    category: 'steering',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'steering-003',
    label: 'パワーステアリングのオイルの量',
    category: 'steering',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'steering-004',
    label: 'パワーステアリング装置の取付けの緩み',
    category: 'steering',
    isOmitted: false,
    status: 'none',
  },
];
```

#### 3-2. 制動装置（ブレーキ）

```typescript
const brakeItems: InspectionItem[] = [
  {
    id: 'brake-001',
    label: 'ブレーキ液の量',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'brake-002',
    label: 'ブレーキパッドの摩耗',
    category: 'brake',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // 測定値が必要
  },
  // ... 他のブレーキ項目
];
```

#### 3-3. 走行装置

```typescript
const runningItems: InspectionItem[] = [
  {
    id: 'running-001',
    label: 'タイヤの空気圧',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'running-002',
    label: 'タイヤの亀裂、損傷',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'running-003',
    label: 'タイヤの溝の深さ、異状摩耗',
    category: 'running',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // 測定値が必要
  },
  // ... 他の走行装置項目
];
```

#### 3-4. 緩衝装置（サスペンション）

```typescript
const suspensionItems: InspectionItem[] = [
  {
    id: 'suspension-001',
    label: 'コイル・サスペンション 取付部、連結部の緩み、がた',
    category: 'suspension',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'suspension-002',
    label: 'コイル・サスペンション 各部の損傷',
    category: 'suspension',
    isOmitted: false,
    status: 'none',
  },
  // ... 他のサスペンション項目
];
```

#### 3-5. 動力伝達装置（ドライブトレイン）

```typescript
const drivetrainItems: InspectionItem[] = [
  {
    id: 'drivetrain-001',
    label: 'トランスミッション、トランスファ オイルの漏れ',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-002',
    label: 'トランスミッション、トランスファ オイルの量',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  // ... 他の動力伝達装置項目
];
```

---

## 24ヶ月点検 詳細設計

### 1. 検査項目の構造

**6つのカテゴリ**:
1. **エンジン・ルーム点検**
2. **室内点検**
3. **足廻り点検**
4. **下廻り点検**
5. **外廻り点検**
6. **日常点検**

### 2. 画面レイアウト（12ヶ月点検と同様、カテゴリが異なる）

#### 2-1. タブナビゲーション（6タブ）

```typescript
<Tabs defaultValue="engine-room">
  <TabsList className="grid grid-cols-6 gap-2">
    <TabsTrigger value="engine-room">
      エンジン・ルーム
      {getCategoryProgress('engine-room') > 0 && (
        <Badge>{getCategoryProgress('engine-room')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="interior">
      室内
      {getCategoryProgress('interior') > 0 && (
        <Badge>{getCategoryProgress('interior')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="chassis">
      足廻り
      {getCategoryProgress('chassis') > 0 && (
        <Badge>{getCategoryProgress('chassis')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="underbody">
      下廻り
      {getCategoryProgress('underbody') > 0 && (
        <Badge>{getCategoryProgress('underbody')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="exterior">
      外廻り
      {getCategoryProgress('exterior') > 0 && (
        <Badge>{getCategoryProgress('exterior')}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="daily">
      日常
      {getCategoryProgress('daily') > 0 && (
        <Badge>{getCategoryProgress('daily')}</Badge>
      )}
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### 3. 24ヶ月点検の検査項目リスト

#### 3-1. エンジン・ルーム点検

```typescript
const engineRoomItems: InspectionItem[] = [
  {
    id: 'engine-room-001',
    label: 'ステアリング パワーステアリングのベルトの緩み、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-002',
    label: 'ステアリング パワーステアリングのオイルの漏れ',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-003',
    label: 'ステアリング パワーステアリングのオイルの量',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-004',
    label: 'ステアリング パワーステアリング装置の取付けの緩み',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-005',
    label: 'ブレーキ ブレーキ液の量',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-006',
    label: 'クラッチ クラッチ液の量',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-007',
    label: '点火装置 スパークプラグの状態',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-008',
    label: '点火装置 点火時期',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-009',
    label: '点火装置 ディストリビュータのキャップの状態',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-010',
    label: 'バッテリー ターミナル部の緩み、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-011',
    label: '電気装置 接続部の緩み、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-012',
    label: 'エンジン 低速、加速の状態',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-013',
    label: 'エンジン 排気ガスの色',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-014',
    label: 'エンジン CO、HCの濃度',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // CO・HC濃度の測定値が必要
  },
  {
    id: 'engine-room-015',
    label: 'エンジン エアクリーナエレメントの汚れ、詰り、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-016',
    label: '燃料装置 燃料漏れ',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-017',
    label: '冷却装置 ファンベルトの緩み、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-018',
    label: '冷却装置 冷却水の漏れ',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  // ... 公害発散防止装置等の項目
];
```

#### 3-2. 室内点検

```typescript
const interiorItems: InspectionItem[] = [
  {
    id: 'interior-001',
    label: 'ハンドル 操作具合',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-002',
    label: 'ハンドル 遊び、がた',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-003',
    label: 'ハンドル ハンドルロックの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-004',
    label: 'ブレーキペダル 遊び',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-005',
    label: 'ブレーキペダル 踏み込んだときの床板とのすき間',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-006',
    label: 'ブレーキペダル ブレーキのきき具合',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-007',
    label: 'パーキングブレーキレバー（ペダル） 引きしろ（踏みしろ）',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-008',
    label: 'パーキングブレーキレバー（ペダル） パーキングブレーキのきき具合',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-009',
    label: 'クラッチペダル 遊び',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-010',
    label: 'クラッチペダル 切れたときの床板とのすき間',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-011',
    label: 'クラッチペダル クラッチの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-012',
    label: '動力用主電池 インテークフィルタの状態',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-013',
    label: 'その他 座席ベルトの損傷、作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-014',
    label: 'その他 ホーンの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-015',
    label: 'その他 ワイパの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-016',
    label: 'その他 ウインドウォッシャの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-017',
    label: 'その他 デフロスタの作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'interior-018',
    label: 'その他 施錠装置の作用',
    category: 'interior',
    isOmitted: false,
    status: 'none',
  },
];
```

#### 3-3. 足廻り点検

```typescript
const chassisItems: InspectionItem[] = [
  {
    id: 'chassis-001',
    label: 'かじ取り車輪 ホイールアライメント',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-002',
    label: 'ブレーキディスク、ドラム ディスクとパッドとのすき間',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-003',
    label: 'ブレーキディスク、ドラム ブレーキパッドの摩耗',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // 測定値が必要
  },
  {
    id: 'chassis-004',
    label: 'ブレーキディスク、ドラム ディスクの摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-005',
    label: 'ブレーキディスク、ドラム ドラムとライニングとのすき間',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-006',
    label: 'ブレーキディスク、ドラム ブレーキシューの摺動部分、ライニングの摩耗',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-007',
    label: 'ブレーキディスク、ドラム ドラムの摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-008',
    label: 'タイヤ、ホイール タイヤの空気圧',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-009',
    label: 'タイヤ、ホイール タイヤの亀裂、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-010',
    label: 'タイヤ、ホイール タイヤの溝の深さ、異状摩耗',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // 測定値が必要
  },
  // ... 他の足廻り項目
];
```

#### 3-4. 下廻り点検

```typescript
const underbodyItems: InspectionItem[] = [
  {
    id: 'underbody-001',
    label: 'ステアリング ギヤボックスの取付けの緩み',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-002',
    label: 'ステアリング ロッド、アーム類のボールジョイントの緩み、がた、損傷',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-003',
    label: 'ステアリング ロッド、アーム類のボールジョイントのダストブーツの亀裂、損傷',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-004',
    label: 'ステアリング ナックルの連結部のがた',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-005',
    label: 'ブレーキホース、パイプ 漏れ、損傷、取付状態',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  // ... 他の下廻り項目
];
```

#### 3-5. 外廻り点検

```typescript
const exteriorItems: InspectionItem[] = [
  {
    id: 'exterior-001',
    label: '車体枠及び車体 緩み、損傷',
    category: 'exterior',
    isOmitted: false,
    status: 'none',
  },
];
```

#### 3-6. 日常点検

```typescript
const dailyItems: InspectionItem[] = [
  {
    id: 'daily-001',
    label: 'バッテリーの液量',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-002',
    label: '冷却水の量（ハイブリッド車は、インバーターを含む）',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-003',
    label: 'エンジンオイルの量',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-004',
    label: 'エンジンのかかり具合、異音',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-005',
    label: '灯火装置及び方向指示器の作用、汚れ、損傷',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-006',
    label: 'ウインドウォッシャーの液量',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
];
```

### 4. 24ヶ月点検の測定値入力（車検ライン）

24ヶ月点検（車検）では、完成検査時にテスター数値を入力する必要があります。

```typescript
// 車検ライン測定値入力セクション
<TestLineMeasurementSection>
  <Card>
    <CardHeader>
      <CardTitle>完成検査（テスター数値）</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* ブレーキ制動力 */}
      <div>
        <Label>ブレーキ制動力（%）</Label>
        <Input
          type="number"
          step="0.1"
          value={testLineMeasurements.brakeForce}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, brakeForce: parseFloat(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* サイドスリップ */}
      <div>
        <Label>サイドスリップ（m/km）</Label>
        <Input
          type="number"
          step="0.1"
          value={testLineMeasurements.sideSlip}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, sideSlip: parseFloat(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* スピードメーター誤差 */}
      <div>
        <Label>スピードメーター誤差（%）</Label>
        <Input
          type="number"
          step="0.1"
          value={testLineMeasurements.speedometerError}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, speedometerError: parseFloat(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* 排ガス（CO濃度） */}
      <div>
        <Label>排ガス CO濃度（%）</Label>
        <Input
          type="number"
          step="0.01"
          value={testLineMeasurements.coConcentration}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, coConcentration: parseFloat(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* 排ガス（HC濃度） */}
      <div>
        <Label>排ガス HC濃度（ppm）</Label>
        <Input
          type="number"
          step="1"
          value={testLineMeasurements.hcConcentration}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, hcConcentration: parseInt(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* ヘッドライト（上向き） */}
      <div>
        <Label>ヘッドライト 上向き（cd）</Label>
        <Input
          type="number"
          step="1"
          value={testLineMeasurements.headlightUp}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, headlightUp: parseInt(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
      
      {/* ヘッドライト（下向き） */}
      <div>
        <Label>ヘッドライト 下向き（cd）</Label>
        <Input
          type="number"
          step="1"
          value={testLineMeasurements.headlightDown}
          onChange={(e) => setTestLineMeasurements({ ...testLineMeasurements, headlightDown: parseInt(e.target.value) })}
          className="h-12 text-lg"
        />
      </div>
    </CardContent>
  </Card>
</TestLineMeasurementSection>
```

---

## 共通機能

### 1. オート進捗（スマート・フォーカス）

```typescript
// オート進捗機能
const handleStatusChange = useCallback((status: InspectionStatus) => {
  if (!currentItem) return;
  
  // ステータスを更新
  updateItemStatus(currentItem.id, status);
  
  // ハプティックフィードバック
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
  
  // 次の項目へ自動スクロール
  const nextItem = getNextItem(currentItem.id);
  if (nextItem) {
    // 次の項目の要素を取得
    const nextElement = document.querySelector(`[data-item-id="${nextItem.id}"]`);
    if (nextElement) {
      // スムーズスクロール
      nextElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // フォーカスを設定（キーボード操作対応）
      setTimeout(() => {
        nextElement.focus();
      }, 300);
    }
    
    // 現在の項目を更新
    setCurrentItem(nextItem);
  } else {
    // 最後の項目の場合、完了を促す
    toast.success('すべての項目の入力が完了しました');
  }
}, [currentItem, updateItemStatus, getNextItem]);
```

### 2. 要整備リストの自動生成

```typescript
// 要整備リストコンポーネント
const abnormalItems = useMemo(() => {
  return allItems.filter(item => 
    item.status === 'exchange' || 
    item.status === 'adjust' || 
    item.status === 'repair'
  );
}, [allItems]);

// 要整備リスト表示
{abnormalItems.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>要整備リスト（{abnormalItems.length}件）</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {abnormalItems.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 rounded border">
            <span className="text-sm">{item.label}</span>
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getStatusLabel(item.status)}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

### 3. 進捗バーの計算

```typescript
// 進捗バーの計算
const progress = useMemo(() => {
  const completed = allItems.filter(item => item.status !== 'none').length;
  const total = allItems.length;
  return {
    completed,
    total,
    percentage: total > 0 ? (completed / total) * 100 : 0,
  };
}, [allItems]);

// カテゴリ別進捗
const getCategoryProgress = useCallback((category: string) => {
  const categoryItems = allItems.filter(item => item.category === category);
  const completed = categoryItems.filter(item => item.status !== 'none').length;
  return completed;
}, [allItems]);
```

---

## データモデル

### 1. 検査項目の型定義

```typescript
// src/types/inspection.ts
export type InspectionStatus = 
  | 'good'      // レ（点検良好）
  | 'exchange'  // ×（交換）
  | 'adjust'    // A（調整）
  | 'clean'     // C（清掃）
  | 'tighten'   // T（締付）
  | 'repair'    // △（修理）
  | 'none';     // /（該当なし）

export interface InspectionItem {
  id: string;
  label: string;
  category: string;
  isOmitted?: boolean; // 省略可能項目かどうか
  status: InspectionStatus;
  note?: string; // 備考やメモ
  requiresMeasurement?: boolean; // 測定値が必要かどうか
  measuredValue?: number; // 測定値（例: パッド残量）
}

export interface InspectionCategory {
  id: string;
  title: string;
  items: InspectionItem[];
}

export interface InspectionMeasurements {
  // CO・HC濃度
  co?: number;
  hc?: number;
  
  // ブレーキパッド厚さ
  brakeFrontLeft?: number;
  brakeFrontRight?: number;
  brakeRearLeft?: number;
  brakeRearRight?: number;
  
  // タイヤ溝深さ
  tireFrontLeft?: number;
  tireFrontRight?: number;
  tireRearLeft?: number;
  tireRearRight?: number;
}

export interface InspectionParts {
  engineOil?: number; // L
  oilFilter?: number; // 個
  wiperRubber?: number; // 個
  airFilter?: number; // 個
}

// 24ヶ月点検（車検）用のテスター数値
export interface TestLineMeasurements {
  brakeForce?: number; // ブレーキ制動力（%）
  sideSlip?: number; // サイドスリップ（m/km）
  speedometerError?: number; // スピードメーター誤差（%）
  coConcentration?: number; // CO濃度（%）
  hcConcentration?: number; // HC濃度（ppm）
  headlightUp?: number; // ヘッドライト上向き（cd）
  headlightDown?: number; // ヘッドライト下向き（cd）
}

export interface InspectionFormData {
  type: '12month' | '24month';
  items: InspectionItem[];
  measurements: InspectionMeasurements;
  parts: InspectionParts;
  testLineMeasurements?: TestLineMeasurements; // 24ヶ月点検のみ
  completedAt?: string;
  inspectorName?: string;
}
```

---

## PDF生成・プレビュー

### 1. PDFプレビュー機能

```typescript
// PDFプレビューコンポーネント
export function InspectionPDFPreview({
  formData,
  templateType,
}: InspectionPDFPreviewProps) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGeneratePDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const pdf = await generateInspectionPDF(formData, templateType);
      setPdfBlob(pdf);
    } catch (error) {
      toast.error('PDF生成に失敗しました');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [formData, templateType]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>点検整備記録簿 プレビュー</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* PDFプレビュー */}
          {pdfBlob && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={URL.createObjectURL(pdfBlob)}
                className="w-full h-[600px]"
                title="PDF Preview"
              />
            </div>
          )}
          
          {/* アクションボタン */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? '生成中...' : 'PDFを生成'}
            </Button>
            
            {pdfBlob && (
              <>
                <Button
                  onClick={() => {
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `点検整備記録簿_${new Date().toISOString().split('T')[0]}.pdf`;
                    a.click();
                  }}
                  variant="outline"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  PDFをダウンロード
                </Button>
                
                <Button
                  onClick={() => {
                    const url = URL.createObjectURL(pdfBlob);
                    window.print();
                  }}
                  variant="outline"
                  size="lg"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  印刷
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. PDF生成ロジック

```typescript
// src/lib/inspection-pdf-generator.ts
export async function generateInspectionPDF(
  formData: InspectionFormData,
  templateType: '12month' | '24month'
): Promise<Blob> {
  // PDFテンプレートを読み込み
  const templatePath = templateType === '12month' 
    ? '/12カ月点検テンプレート.pdf'
    : '/24カ月点検テンプレート.pdf';
  
  const templateResponse = await fetch(templatePath);
  const templateArrayBuffer = await templateResponse.arrayBuffer();
  
  // PDF.jsまたはpdf-libを使用してテンプレートを読み込み
  const pdfDoc = await PDFDocument.load(templateArrayBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  // フォームデータをPDFに反映
  const { width, height } = firstPage.getSize();
  
  // 検査項目の記号を配置
  formData.items.forEach(item => {
    const position = getItemPosition(item.id, templateType);
    if (position) {
      const symbol = getStatusSymbol(item.status);
      firstPage.drawText(symbol, {
        x: position.x,
        y: height - position.y, // PDFの座標系は左下が原点
        size: 12,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      });
    }
  });
  
  // 測定値を配置
  if (formData.measurements) {
    // CO濃度
    if (formData.measurements.co !== undefined) {
      firstPage.drawText(
        formData.measurements.co.toFixed(1),
        { x: 100, y: height - 200, size: 10 }
      );
    }
    // HC濃度
    if (formData.measurements.hc !== undefined) {
      firstPage.drawText(
        formData.measurements.hc.toString(),
        { x: 150, y: height - 200, size: 10 }
      );
    }
    // ブレーキパッド厚さ
    if (formData.measurements.brakeFrontLeft !== undefined) {
      firstPage.drawText(
        formData.measurements.brakeFrontLeft.toFixed(1),
        { x: 100, y: height - 250, size: 10 }
      );
    }
    // ... 他の測定値も同様に配置
  }
  
  // 車両情報を配置
  // ... 車両情報の配置ロジック
  
  // PDFを生成
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

---

## 実装優先順位

### Phase 1: 基本UI実装（最優先）

1. **ヘッダーと進捗バー** - 1日
2. **タブナビゲーション** - 1日
3. **カテゴリ別項目リスト** - 2日
4. **固定ボトムナビゲーション（親指最適化）** - 2日

**合計**: 約6日

### Phase 2: 入力機能の実装

1. **「全項目良好」ボタン** - 1日
2. **オート進捗機能** - 2日
3. **要整備リストの自動生成** - 1日
4. **測定値入力エリア** - 2日

**合計**: 約6日

### Phase 3: PDF生成・プレビュー

1. **PDF生成ロジック** - 3日
2. **PDFプレビューコンポーネント** - 2日
3. **印刷機能** - 1日

**合計**: 約6日

### Phase 4: 12ヶ月点検の項目定義

1. **5カテゴリの項目リスト作成** - 2日
2. **データモデルの拡張** - 1日

**合計**: 約3日

### Phase 5: 24ヶ月点検の項目定義

1. **6カテゴリの項目リスト作成** - 3日
2. **テスター数値入力エリア** - 2日

**合計**: 約5日

### 総合計: 約26日（約5週間）

---

## まとめ

この再設計により、以下の目標を達成します：

1. ✅ **入力効率の最大化**: 「全項目良好」ボタンとオート進捗で入力時間を大幅短縮
2. ✅ **親指最適化**: 頻繁に使用する「良好（レ）」を右下に巨大配置
3. ✅ **視認性の向上**: 大きなフォントとコントラストで屋外でも見やすい
4. ✅ **PDF生成**: 入力した数値をテンプレートPDFに反映してプレビュー・印刷

整備士の業務効率と満足度が向上することが期待されます。

---

**更新履歴:**
- 2025-01-XX: 初版作成（12ヶ月点検・24ヶ月点検 診断画面 再設計仕様書）





