# 改善提案 #14: 写真管理機能の強化

**提案日:** 2025-12-21  
**優先度:** 低（利便性の向上）  
**実装工数見積:** 1-2日  
**影響範囲:** 整備士

---

## 提案の概要

現在のシステムでは、写真を撮影することはできますが、撮影した写真を削除したり、順番を入れ替えたりする機能がありません。写真の管理を容易にするため、これらの機能を追加します。

本提案では、以下の機能を追加します：
1. **撮影した写真を削除する機能**
2. **写真の順番を入れ替える機能**（ドラッグ&ドロップ）
3. **写真の削除確認ダイアログ**
4. **削除の取り消し機能**（将来の拡張）

---

## なぜ必要か：ユーザーコメントから

### 🔧 整備士（佐藤 健一様）のコメント

**改善してほしい点:**
> 「写真撮影した後、写真を削除したり、順番を入れ替えたりする機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - 写真の削除・順番入れ替え機能

**業務上の課題:**
- 誤って撮影した写真を削除したい
- 写真の順番を入れ替えて、見やすくしたい
- 写真の管理を容易にしたい

---

## 現在の実装状況

### 実装済みの機能

1. **写真撮影機能**
   - 写真を撮影できる機能が実装済み
   - 写真のプレビュー表示機能が実装済み

2. **写真の表示機能**
   - 診断結果画面で、写真を表示できる機能が実装済み

### 未実装の機能

1. **写真削除機能**
   - 撮影した写真を削除する機能がない

2. **写真順番入れ替え機能**
   - 写真の順番を入れ替える機能がない
   - ドラッグ&ドロップ機能がない

3. **削除確認機能**
   - 写真削除時の確認ダイアログがない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 削除の確認プロンプト

**事例:**
- **Instagram**: ユーザーが写真を削除しようとする際、「この投稿を削除しますか？」のような確認メッセージを表示。
- **Google Photos**: 削除前に確認ダイアログを表示。

**ベストプラクティス:**
- ユーザーが写真を削除しようとする際、確認ダイアログを表示
- 誤操作による損失を防止
- 明確な確認メッセージを提供

---

### 2. 取り消しオプション

**事例:**
- **Google Photos**: 削除直後に取り消し機能を提供。ユーザーが意図しない削除を迅速に元に戻せる。
- **Dropbox**: 削除後に取り消しオプションを提供。

**ベストプラクティス:**
- 削除直後に取り消し機能を提供
- ユーザーが意図しない削除を迅速に元に戻せる
- ワークフローを中断しない

---

### 3. ソフト削除メカニズム

**事例:**
- **Google Photos**: 永続的な削除の代わりに、「ゴミ箱」または「アーカイブ」フォルダに写真を移動。一定期間内に復元可能。
- **Dropbox**: 削除したファイルを一定期間保持し、復元可能。

**ベストプラクティス:**
- 永続的な削除の代わりに、「ゴミ箱」または「アーカイブ」フォルダに写真を移動
- 一定期間内に復元可能
- ユーザーに安全網を提供

---

### 4. ドラッグ&ドロップ機能

**事例:**
- **Google Photos**: ユーザーがアルバムやギャラリー内で写真を直感的なドラッグ&ドロップ操作で再配置できる。
- **Figma**: ドラッグ&ドロップ操作で要素を再配置。

**ベストプラクティス:**
- ユーザーがアルバムやギャラリー内で写真を直感的なドラッグ&ドロップ操作で再配置できる
- ユーザーフレンドリーで、一般的なデジタル行動に合致
- 視覚的なフィードバックを提供

---

### 5. 視覚的フィードバック

**事例:**
- **Notion**: 再配置プロセス中に、新しい位置をハイライトしたり、プレースホルダーを表示したりするなど、即座の視覚的手がかりを提供。
- **Figma**: ドラッグ&ドロップ中に視覚的フィードバックを提供。

**ベストプラクティス:**
- 再配置プロセス中に、新しい位置をハイライトしたり、プレースホルダーを表示したりするなど、即座の視覚的手がかりを提供
- ユーザーにアクションを確認
- 操作の結果を明確に表示

---

## 実装方法の詳細

### 1. 写真削除機能

**実装方法:**
```tsx
// 写真一覧に削除ボタンを追加
<div className="grid grid-cols-3 gap-2">
  {photos.map((photo, index) => (
    <div key={photo.id} className="relative group">
      <img
        src={photo.previewUrl}
        alt={`写真 ${index + 1}`}
        className="w-full h-24 object-cover rounded"
      />
      <button
        onClick={() => handleDeletePhoto(photo.id)}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="写真を削除"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  ))}
</div>

// 写真削除確認ダイアログ
<Dialog open={isDeletePhotoDialogOpen} onOpenChange={setIsDeletePhotoDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>写真を削除</DialogTitle>
      <DialogDescription>
        この写真を削除しますか？この操作は取り消せません。
      </DialogDescription>
    </DialogHeader>
    
    {selectedPhoto && (
      <div className="flex justify-center">
        <img
          src={selectedPhoto.previewUrl}
          alt="削除する写真"
          className="max-w-full max-h-48 rounded"
        />
      </div>
    )}
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsDeletePhotoDialogOpen(false)}>
        キャンセル
      </Button>
      <Button variant="destructive" onClick={handleDeletePhotoConfirm}>
        削除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 2. 写真順番入れ替え機能

**実装方法:**
```tsx
// react-beautiful-dndを使用したドラッグ&ドロップ
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

<DragDropContext onDragEnd={handlePhotoReorder}>
  <Droppable droppableId="photos" direction="horizontal">
    {(provided) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className="flex gap-2 overflow-x-auto"
      >
        {photos.map((photo, index) => (
          <Draggable key={photo.id} draggableId={photo.id} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cn(
                  "relative group",
                  snapshot.isDragging && "opacity-50"
                )}
              >
                <img
                  src={photo.previewUrl}
                  alt={`写真 ${index + 1}`}
                  className="w-24 h-24 object-cover rounded cursor-move"
                />
                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>

// 写真の順番入れ替え処理
function handlePhotoReorder(result: DropResult) {
  if (!result.destination) return;
  
  const items = Array.from(photos);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  
  setPhotos(items);
  
  toast.success("写真の順番を変更しました");
}
```

---

### 3. 削除の取り消し機能（将来の拡張）

**実装方法:**
```typescript
// 削除した写真を一時的に保持
const [deletedPhotos, setDeletedPhotos] = useState<Photo[]>([]);

function handleDeletePhotoConfirm() {
  // 写真を削除リストに追加（30秒間保持）
  setDeletedPhotos((prev) => [...prev, selectedPhoto]);
  
  // 写真を実際に削除
  setPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id));
  
  setIsDeletePhotoDialogOpen(false);
  
  // 取り消しトーストを表示
  toast.success("写真を削除しました", {
    action: {
      label: "取り消し",
      onClick: () => handleUndoDelete(selectedPhoto),
    },
    duration: 5000, // 5秒間表示
  });
  
  // 30秒後に完全に削除
  setTimeout(() => {
    setDeletedPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id));
  }, 30000);
}

function handleUndoDelete(photo: Photo) {
  // 写真を復元
  setPhotos((prev) => [...prev, photo]);
  setDeletedPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  
  toast.success("写真を復元しました");
}
```

---

## 期待される効果

### 業務効率の向上

1. **写真管理の効率化**
   - 誤って撮影した写真を削除できるため、写真管理が容易になる
   - 写真の順番を入れ替えて、見やすくできる
   - **時間短縮:** 写真管理の時間が約30%短縮（推定）

2. **作業の品質向上**
   - 写真の順番を適切に整理することで、診断結果の説明がしやすくなる
   - 不要な写真を削除することで、重要な写真に集中できる

---

### ユーザー体験の向上

1. **操作の簡素化**
   - ドラッグ&ドロップにより、写真の順番入れ替えが簡単に操作できる
   - 削除確認ダイアログにより、誤操作を防止

2. **視覚的フィードバック**
   - ドラッグ&ドロップ中に視覚的フィードバックを提供
   - 操作の結果を明確に表示

---

## 実装の優先度と理由

### 優先度: 低（利便性の向上）

**理由:**

1. **利便性の向上**
   - 写真管理の時間が約30%短縮（推定）
   - 写真の管理が容易になる

2. **実装の容易さ**
   - 既存の写真表示機能を拡張するだけで実装可能
   - 実装工数: 1-2日（見積）

3. **ユーザー要望**
   - 整備士から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: 写真削除機能の実装（0.5日）
- 写真削除ボタンの追加
- 削除確認ダイアログの実装
- 写真削除処理

### Phase 2: 写真順番入れ替え機能の実装（1日）
- react-beautiful-dndのインストール・設定
- ドラッグ&ドロップ機能の実装
- 順番入れ替え処理

### Phase 3: 削除の取り消し機能（将来の拡張）（0.5日）
- 削除した写真の一時保持
- 取り消しトーストの実装
- 復元機能

**合計:** 2日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md`](../reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md) - 整備士のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #14 を作成



