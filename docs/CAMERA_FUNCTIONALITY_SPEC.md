# カメラ機能仕様書

## 現在の実装状況

### 1. PhotoCaptureButtonコンポーネント
**ファイル**: `src/components/features/photo-capture-button.tsx`

#### 実装済み機能

1. **基本撮影機能**
   - HTML5の`<input type="file" accept="image/*" capture="environment">`を使用
   - モバイル端末でカメラを直接起動（`capture`属性）
   - PCではファイル選択ダイアログを表示

2. **画像圧縮**
   - **ライブラリ**: `browser-image-compression`
   - **目標サイズ**: 500KB以下
   - **最大解像度**: 1920px（幅または高さ）
   - **フォーマット**: JPEG形式で出力
   - **WebWorker使用**: UIブロッキングを防止

3. **プレビュー表示**
   - 撮影後に縮小プレビューを表示（右上にサムネイル）
   - Data URLを使用した即時プレビュー

4. **状態管理**
   - 撮影済み/未撮影の状態表示
   - 圧縮中のローディング表示
   - エラーハンドリング

5. **カスタマイズオプション**
   - サイズ: `sm`, `default`, `lg`
   - カメラモード: `environment`（背面カメラ） / `user`（前面カメラ）
   - ラベル表示
   - 無効化フラグ

### 2. 画像圧縮ユーティリティ
**ファイル**: `src/lib/compress.ts`

```typescript
compressImage(file: File): Promise<File>
- 目標サイズ: 500KB以下
- 最大解像度: 1920px
- フォーマット: JPEG
```

## 未実装機能

### 1. リアルタイムカメラプレビュー
- **現在**: ファイル選択後にプレビュー表示
- **未実装**: `getUserMedia` APIを使用したリアルタイムカメラビュー

### 2. フレームガイド機能 ⭐（要実装）
- **グリッド表示**: 三分割法グリッド、黄金比グリッド
- **枠線ガイド**: 被写体をフレーム内に収めるためのガイドライン
- **レベル表示**: 水平・垂直の傾きを表示

### 3. 写真品質チェック
- 明るさチェック
- フォーカスチェック（ぼけ検出）
- 被写体検出（車両がフレーム内に収まっているか）

### 4. 高度な撮影機能
- 自動フォーカス/露出調整
- 手ブレ補正
- 連写機能
- タイマー撮影

## 提案：フレームガイド機能の実装

### 仕様案

#### 1. リアルタイムカメラプレビュー
- `getUserMedia` APIを使用してカメラストリームを取得
- `<video>`要素でリアルタイムプレビューを表示
- `<canvas>`要素を使用して写真をキャプチャ

#### 2. フレームガイド表示
**オプションA: グリッドガイド**
- 三分割法グリッド（3x3グリッド）
- 車両撮影用の推奨エリア表示

**オプションB: 枠線ガイド**
- 被写体（車両）を収めるための推奨エリアを枠線で表示
- アスペクト比に応じたガイド表示

**オプションC: 組み合わせ**
- グリッド + 枠線の組み合わせ
- トグルでON/OFF切り替え可能

#### 3. UI仕様
- ガイド線の色: 半透明の白またはグレー（`rgba(255, 255, 255, 0.6)`）
- 線の太さ: 1-2px
- ガイド表示のON/OFF切り替えボタン

### 実装アプローチ

#### オプション1: 既存コンポーネントを拡張
- `PhotoCaptureButton`を拡張してカメラプレビュー機能を追加
- オプショナルな機能として実装（既存の動作を維持）

#### オプション2: 新しいコンポーネントを作成
- `CameraPreview`コンポーネントを新規作成
- `PhotoCaptureButton`と併用可能な設計

### 技術的検討事項

1. **ブラウザ対応**
   - `getUserMedia` APIの対応状況
   - HTTPS必須（ローカル開発環境では`localhost`で動作）
   - モバイルブラウザの対応状況

2. **パフォーマンス**
   - カメラストリームのメモリ使用量
   - 複数のカメラプレビューを同時表示する場合の負荷

3. **UX設計**
   - カメラ起動時のパーミッション要求
   - 撮影フローの簡素化
   - 40+ユーザー向けの直感的なUI

## 参考実装例

```typescript
// カメラプレビューコンポーネントの擬似コード
const CameraPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // カメラ起動
  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    }
  };

  // 写真撮影
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          onCapture(position, file);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline />
      {showGrid && <GridOverlay />}
      <button onClick={capturePhoto}>撮影</button>
    </div>
  );
};
```




