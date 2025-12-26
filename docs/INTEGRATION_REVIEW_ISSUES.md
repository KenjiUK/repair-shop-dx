# 結合レビュー: 連動漏れ・実装漏れの確認結果

## 🔴 重大な問題（即座に修正が必要）

### 1. 見積画面: 診断写真の変更がワークオーダーに反映されていない

**問題:**
- `PhotoManager`で診断写真を削除・順番入れ替えした際、ローカル状態（`photos`）は更新されるが、ワークオーダーの`diagnosis.photos`が更新されていない
- 見積保存時に診断写真がワークオーダーに保存されるが、保存前の変更（削除・順番入れ替え）が反映されていない可能性がある

**該当コード:**
- `src/app/admin/estimate/[id]/page.tsx` (2448-2462行目)
- `src/app/admin/estimate/[id]/page.tsx` (1915-1935行目: `handleSendLine`)

**修正方法:**
- `PhotoManager`の`onPhotosChange`コールバックで、ワークオーダーの`diagnosis.photos`を即座に更新する
- または、見積保存時に最新の`photos`状態をワークオーダーに反映する

---

### 2. 作業画面: Before/After写真の変更がワークオーダーに反映されていない

**問題:**
- `PhotoManager`でBefore/After写真を削除・順番入れ替えした際、ローカル状態（`approvedWorkItems`）は更新されるが、ワークオーダーの`work.records`が更新されていない
- 作業完了時に写真がワークオーダーに保存されるが、保存前の変更（削除・順番入れ替え）が反映されていない可能性がある

**該当コード:**
- `src/app/mechanic/work/[id]/page.tsx` (1690-1709行目)
- `src/app/mechanic/work/[id]/page.tsx` (1080-1100行目: `handleAllComplete`)

**修正方法:**
- `PhotoManager`の`onBeforePhotosChange`/`onAfterPhotosChange`コールバックで、ワークオーダーの`work.records`を即座に更新する
- または、作業完了時に最新の`approvedWorkItems`状態をワークオーダーに反映する

---

### 3. 作業画面: 写真のGoogle Driveアップロードが実装されていない

**問題:**
- `PhotoCaptureButton`で写真を撮影しても、Google Driveへのアップロードが行われていない
- 作業完了時に写真がワークオーダーに保存されるが、Google Driveへのアップロードが行われていない可能性がある
- 診断画面では写真のGoogle Driveアップロードが実装されているが、作業画面では実装されていない

**該当コード:**
- `src/app/mechanic/work/[id]/page.tsx` (1620-1690行目: `handleBeforePhotoCapture`/`handleAfterPhotoCapture`)
- `src/app/mechanic/diagnosis/[id]/page.tsx` (1252-1314行目: 写真アップロード実装の参考)

**修正方法:**
- `handleBeforePhotoCapture`/`handleAfterPhotoCapture`で、写真をGoogle Driveにアップロードする処理を追加
- アップロード後に取得したURLを`approvedWorkItems`に保存する

---

## 🟡 中程度の問題（機能は動作するが不完全）

### 4. 見積保存時に診断写真がワークオーダーに保存されるか確認が必要

**問題:**
- 見積保存時（`handleSendLine`）に、診断写真（`photos`）がワークオーダーの`diagnosis.photos`に保存されるか確認が必要
- 現在の実装では、見積データ（`estimateData`）に写真が含まれているが、ワークオーダーの診断データに写真が保存されるか不明

**該当コード:**
- `src/app/admin/estimate/[id]/page.tsx` (1915-1935行目: `handleSendLine`)

**確認方法:**
- `createEstimate`関数がワークオーダーの診断データを更新するか確認
- または、見積保存時に明示的にワークオーダーの診断写真を更新する

---

### 5. 診断保存時に写真のGoogle Driveアップロードが完了しているか確認が必要

**問題:**
- 診断画面では写真のGoogle Driveアップロードが実装されているが、診断保存時にアップロード済みの写真URLがワークオーダーに保存されるか確認が必要
- 診断保存時（`handleSave`）に、`photos`状態の写真URLがワークオーダーの`diagnosis.photos`に保存されるか確認が必要

**該当コード:**
- `src/app/mechanic/diagnosis/[id]/page.tsx` (2420-2436行目: `handleSave`)
- `src/app/mechanic/diagnosis/[id]/page.tsx` (1252-1314行目: 写真アップロード実装)

**確認方法:**
- 診断保存時に、`photos`状態の写真URLが`diagnosisData.photos`に含まれているか確認
- ワークオーダー更新時に、`diagnosis.photos`が正しく保存されるか確認

---

## 📋 修正優先順位

1. **最優先（機能が動作しない、または重要な機能が不完全）:**
   - 見積画面: 診断写真の変更がワークオーダーに反映されていない
   - 作業画面: Before/After写真の変更がワークオーダーに反映されていない
   - 作業画面: 写真のGoogle Driveアップロードが実装されていない

2. **高優先度（機能が不完全）:**
   - 見積保存時に診断写真がワークオーダーに保存されるか確認が必要
   - 診断保存時に写真のGoogle Driveアップロードが完了しているか確認が必要

---

## 🔍 確認が必要なデータフロー

### 診断 → 見積のデータフロー
1. 診断画面で写真を撮影 → Google Driveにアップロード → ワークオーダーの`diagnosis.photos`に保存 ✅（実装済み）
2. 見積画面で診断写真を表示 → ワークオーダーの`diagnosis.photos`から読み込み ✅（実装済み）
3. 見積画面で診断写真を削除・順番入れ替え → ワークオーダーの`diagnosis.photos`を更新 ❌（未実装）
4. 見積保存時 → 診断写真がワークオーダーに保存されるか確認が必要 ⚠️（確認が必要）

### 見積 → 作業のデータフロー
1. 見積承認後、作業画面でBefore/After写真を撮影 → Google Driveにアップロード → ワークオーダーの`work.records`に保存 ❌（未実装）
2. 作業画面でBefore/After写真を削除・順番入れ替え → ワークオーダーの`work.records`を更新 ❌（未実装）
3. 作業完了時 → Before/After写真がワークオーダーに保存される ✅（実装済み、ただしGoogle Driveアップロードが未実装）

---

## 📝 修正方針

### 修正1: 見積画面の診断写真変更をワークオーダーに反映

```typescript
// src/app/admin/estimate/[id]/page.tsx
onPhotosChange={(updatedPhotos) => {
  // ローカル状態を更新
  const updatedDiagnosisPhotos: DiagnosisPhoto[] = updatedPhotos.map((p, index) => {
    // ... 既存の変換ロジック ...
  });
  setPhotos(updatedDiagnosisPhotos);
  
  // ワークオーダーの診断写真を即座に更新
  if (selectedWorkOrder?.id) {
    updateWorkOrder(jobId, selectedWorkOrder.id, {
      diagnosis: {
        ...selectedWorkOrder.diagnosis,
        photos: updatedPhotos.map((p) => ({
          position: p.position || p.id,
          url: p.previewUrl,
        })),
      },
    });
  }
}}
```

### 修正2: 作業画面のBefore/After写真変更をワークオーダーに反映

```typescript
// src/app/mechanic/work/[id]/page.tsx
onBeforePhotosChange={(itemId, photos) => {
  // ローカル状態を更新
  setApprovedWorkItems((prev) =>
    prev.map((item) =>
      item.id === itemId ? { ...item, beforePhotos: photos } : item
    )
  );
  
  // ワークオーダーの作業データを即座に更新
  if (selectedWorkOrder?.id) {
    // 該当する作業項目のBefore写真を更新
    const workData = {
      ...selectedWorkOrder.work,
      records: selectedWorkOrder.work?.records?.map((record) => {
        if (record.content === itemId) {
          return {
            ...record,
            photos: [
              ...(record.photos?.filter((p) => p.type !== "before") || []),
              ...photos.map((p) => ({
                type: "before",
                url: p.previewUrl || "",
              })),
            ],
          };
        }
        return record;
      }) || [],
    };
    
    updateWorkOrder(jobId, selectedWorkOrder.id, {
      work: workData,
    });
  }
}}
```

### 修正3: 作業画面の写真Google Driveアップロード実装

```typescript
// src/app/mechanic/work/[id]/page.tsx
const handleBeforePhotoCapture = async (itemId: string, file: File) => {
  try {
    // Google Driveにアップロード
    const workOrderFolder = await getOrCreateWorkOrderFolder(
      job.field4?.id || "",
      job.field4?.name || "",
      job.field6?.id || "",
      job.field6?.name || "",
      jobId,
      formatDateForFolder(job.field22 || new Date().toISOString()),
      selectedWorkOrder?.id || ""
    );
    
    const uploadedFile = await uploadFile({
      file,
      fileName: `before-${itemId}-${Date.now()}.jpg`,
      folderId: workOrderFolder.id,
      mimeType: "image/jpeg",
    });
    
    // ローカル状態を更新
    setApprovedWorkItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              beforePhotos: [
                ...item.beforePhotos,
                {
                  position: `before-${itemId}`,
                  previewUrl: uploadedFile.webViewLink || uploadedFile.id,
                  file: file,
                  isCompressing: false,
                },
              ],
            }
          : item
      )
    );
    
    toast.success("Before写真をアップロードしました");
  } catch (error) {
    console.error("Before写真アップロードエラー:", error);
    toast.error("写真のアップロードに失敗しました");
  }
};
```

---

## ✅ 確認済みの連動

1. **診断保存 → ワークオーダー更新**: ✅ 実装済み
2. **見積保存 → ワークオーダー更新**: ✅ 実装済み
3. **作業完了 → ワークオーダー更新**: ✅ 実装済み
4. **診断写真のGoogle Driveアップロード**: ✅ 実装済み
5. **SWRキャッシュの更新**: ✅ 実装済み（`mutateWorkOrders`, `mutateJob`）

---

## 📌 次のステップ

1. 見積画面の診断写真変更をワークオーダーに反映する実装
2. 作業画面のBefore/After写真変更をワークオーダーに反映する実装
3. 作業画面の写真Google Driveアップロード実装
4. 見積保存時に診断写真がワークオーダーに保存されるか確認
5. 診断保存時に写真のGoogle Driveアップロードが完了しているか確認








