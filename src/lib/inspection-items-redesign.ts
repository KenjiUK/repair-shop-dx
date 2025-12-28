/**
 * 12ヶ月点検・24ヶ月点検 再設計版 検査項目リスト
 * 
 * 再設計仕様書: docs/INSPECTION_DIAGNOSIS_PAGE_REDESIGN.md
 */

import {
  InspectionItemRedesign,
  InspectionCategory12Month,
  InspectionCategory24Month,
} from "@/types/inspection-redesign";

// =============================================================================
// 12ヶ月点検 検査項目リスト
// =============================================================================

/**
 * 12ヶ月点検 かじ取り装置（ステアリング）の項目
 */
const steeringItems12Month: InspectionItemRedesign[] = [
  {
    id: 'steering-001',
    label: 'パワーステアリングのベルトの緩み、損傷',
    category: 'steering',
    isStatutory: true,
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

/**
 * 12ヶ月点検 制動装置（ブレーキ）の項目
 */
const brakeItems12Month: InspectionItemRedesign[] = [
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
  {
    id: 'brake-003',
    label: 'ブレーキディスク、ドラムの摩耗、損傷',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'brake-004',
    label: 'ブレーキホース、パイプの漏れ、損傷、取付状態',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'brake-005',
    label: 'マスタシリンダの機能、摩耗、損傷',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'brake-006',
    label: 'ホイールシリンダの機能、摩耗、損傷',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'brake-007',
    label: 'ディスクキャリパの機能、摩耗、損傷',
    category: 'brake',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 12ヶ月点検 走行装置の項目
 */
const runningItems12Month: InspectionItemRedesign[] = [
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
  {
    id: 'running-004',
    label: 'スペアタイヤの空気圧',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'running-005',
    label: 'ホイールボルト、ナットの緩み',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'running-006',
    label: 'フロントホイールベアリングのがた',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'running-007',
    label: 'リヤホイールベアリングのがた',
    category: 'running',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 12ヶ月点検 緩衝装置（サスペンション）の項目
 */
const suspensionItems12Month: InspectionItemRedesign[] = [
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
  {
    id: 'suspension-003',
    label: 'リーフ・スプリング 取付部、連結部の緩み、がた',
    category: 'suspension',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'suspension-004',
    label: 'リーフ・スプリング 各部の損傷',
    category: 'suspension',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'suspension-005',
    label: 'ショックアブソーバ オイル漏れ、損傷',
    category: 'suspension',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 12ヶ月点検 動力伝達装置（ドライブトレイン）の項目
 */
const drivetrainItems12Month: InspectionItemRedesign[] = [
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
  {
    id: 'drivetrain-003',
    label: 'プロペラシャフト、ドライブシャフト 連結部の緩み',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-004',
    label: 'ドライブシャフトのユニバーサルジョイント部のダストブーツの亀裂、損傷',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-005',
    label: 'スプライン部のがた',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-006',
    label: 'ユニバーサルジョイント部のがた',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-007',
    label: 'センタベアリングのがた',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-008',
    label: 'デファレンシャル オイルの漏れ',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-009',
    label: 'デファレンシャル オイルの量',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-010',
    label: 'エンジンオイル 漏れ',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-011',
    label: 'エグゾーストパイプ、マフラ 取付けの緩み、損傷、腐食',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-012',
    label: '遮熱板の取付けの緩み、損傷、腐食',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-013',
    label: 'マフラーの機能',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'drivetrain-014',
    label: 'シャシ各部 給油脂状態',
    category: 'drivetrain',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 12ヶ月点検 全検査項目リスト
 */
export const INSPECTION_ITEMS_12MONTH: InspectionItemRedesign[] = [
  ...steeringItems12Month,
  ...brakeItems12Month,
  ...runningItems12Month,
  ...suspensionItems12Month,
  ...drivetrainItems12Month,
];

/**
 * 12ヶ月点検 カテゴリごとの項目を取得
 */
export function get12MonthItemsByCategory(
  category: InspectionCategory12Month
): InspectionItemRedesign[] {
  return INSPECTION_ITEMS_12MONTH.filter(item => item.category === category);
}

// =============================================================================
// 24ヶ月点検（車検） 検査項目リスト
// =============================================================================

/**
 * 24ヶ月点検 エンジン・ルーム点検の項目
 */
const engineRoomItems24Month: InspectionItemRedesign[] = [
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
  {
    id: 'engine-room-019',
    label: '公害発散防止装置等 メターリングバルブの状態',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-020',
    label: '公害発散防止装置等 ブローバイガス還元装置の配管の損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-021',
    label: '公害発散防止装置等 燃料蒸発ガス排出抑止装置の配管等の損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-022',
    label: '公害発散防止装置等 燃料蒸発ガス排出抑止装置のチェックバルブの機能',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-023',
    label: '公害発散防止装置等 チャコールキャニスタの詰り、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-024',
    label: '公害発散防止装置等 触媒等の排出ガス減少装置の取付けの緩み、損傷',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-025',
    label: '公害発散防止装置等 二次空気供給装置の機能',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-026',
    label: '公害発散防止装置等 排気ガス再循環装置の機能',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-027',
    label: '公害発散防止装置等 減速時排気ガス減少装置の機能',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'engine-room-028',
    label: '公害発散防止装置等 一酸化炭素等発散防止装置の配管の損傷、取付け状態',
    category: 'engine-room',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 24ヶ月点検 室内点検の項目
 */
const interiorItems24Month: InspectionItemRedesign[] = [
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

/**
 * 24ヶ月点検 足廻り点検の項目
 */
const chassisItems24Month: InspectionItemRedesign[] = [
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
    label: 'ブレーキのマスタシリンダ、ホイールシリンダ、ディスクキャリパ マスタシリンダの機能、摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-009',
    label: 'ブレーキのマスタシリンダ、ホイールシリンダ、ディスクキャリパ ホイールシリンダの機能、摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-010',
    label: 'ブレーキのマスタシリンダ、ホイールシリンダ、ディスクキャリパ ディスクキャリパの機能、摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-011',
    label: 'センタブレーキ ドラムの取付けの緩み',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-012',
    label: 'センタブレーキ ドラムとライニングとのすき間',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-013',
    label: 'センタブレーキ ライニングの摩耗',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-014',
    label: 'センタブレーキ ドラムの摩耗、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-015',
    label: 'ブレーキ倍力装置 油密、気密',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-016',
    label: 'ブレーキ倍力装置 チェック・バルブ、リレー・バルブの機能',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-017',
    label: 'ブレーキ倍力装置 エア・クリーナーの詰り',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-018',
    label: 'タイヤ、ホイール タイヤの空気圧',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-019',
    label: 'タイヤ、ホイール タイヤの亀裂、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-020',
    label: 'タイヤ、ホイール タイヤの溝の深さ、異状摩耗',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
    requiresMeasurement: true, // 測定値が必要
  },
  {
    id: 'chassis-021',
    label: 'タイヤ、ホイール スペアタイヤの空気圧',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-022',
    label: 'タイヤ、ホイール ホイールボルト、ナットの緩み',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-023',
    label: 'タイヤ、ホイール フロントホイールベアリングのがた',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-024',
    label: 'タイヤ、ホイール リヤホイールベアリングのがた',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-025',
    label: 'コイル・サスペンション 取付部、連結部の緩み、がた',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-026',
    label: 'コイル・サスペンション 各部の損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-027',
    label: 'リーフ・スプリング 取付部、連結部の緩み、がた',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-028',
    label: 'リーフ・スプリング 各部の損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'chassis-029',
    label: 'ショックアブソーバ オイル漏れ、損傷',
    category: 'chassis',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 24ヶ月点検 下廻り点検の項目
 */
const underbodyItems24Month: InspectionItemRedesign[] = [
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
  {
    id: 'underbody-006',
    label: 'トランスミッション、トランスファ オイルの漏れ',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-007',
    label: 'トランスミッション、トランスファ オイルの量',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-008',
    label: 'プロペラシャフト、ドライブシャフト 連結部の緩み',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-009',
    label: 'プロペラシャフト、ドライブシャフト ドライブシャフトのユニバーサルジョイント部のダストブーツの亀裂、損傷',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-010',
    label: 'プロペラシャフト、ドライブシャフト スプライン部のがた',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-011',
    label: 'プロペラシャフト、ドライブシャフト ユニバーサルジョイント部のがた',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-012',
    label: 'プロペラシャフト、ドライブシャフト センタベアリングのがた',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-013',
    label: 'デファレンシャル オイルの漏れ',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-014',
    label: 'デファレンシャル オイルの量',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-015',
    label: 'エンジンオイル 漏れ',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-016',
    label: 'エグゾーストパイプ、マフラ 取付けの緩み、損傷、腐食',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-017',
    label: 'エグゾーストパイプ、マフラ 遮熱板の取付けの緩み、損傷、腐食',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-018',
    label: 'エグゾーストパイプ、マフラ マフラーの機能',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'underbody-019',
    label: 'シャシ各部 給油脂状態',
    category: 'underbody',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 24ヶ月点検 外廻り点検の項目
 */
const exteriorItems24Month: InspectionItemRedesign[] = [
  {
    id: 'exterior-001',
    label: '車体枠及び車体 緩み、損傷',
    category: 'exterior',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 24ヶ月点検 日常点検の項目
 */
const dailyItems24Month: InspectionItemRedesign[] = [
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
  {
    id: 'daily-007',
    label: 'ブレーキ液の量',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-008',
    label: '低速と加速の状態',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-009',
    label: 'ウインドウォッシャーの噴射状態',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
  {
    id: 'daily-010',
    label: 'ワイパの拭き取り状態',
    category: 'daily',
    isOmitted: false,
    status: 'none',
  },
];

/**
 * 24ヶ月点検 全検査項目リスト（日常点検は除外）
 */
export const INSPECTION_ITEMS_24MONTH: InspectionItemRedesign[] = [
  ...engineRoomItems24Month,
  ...interiorItems24Month,
  ...chassisItems24Month,
  ...underbodyItems24Month,
  ...exteriorItems24Month,
  // 日常点検は除外（任意項目のため）
  // ...dailyItems24Month,
];

/**
 * 24ヶ月点検 カテゴリごとの項目を取得
 */
export function get24MonthItemsByCategory(
  category: InspectionCategory24Month
): InspectionItemRedesign[] {
  return INSPECTION_ITEMS_24MONTH.filter(item => item.category === category);
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 点検タイプに応じた項目リストを取得
 */
export function getInspectionItems(
  type: '12month' | '24month'
): InspectionItemRedesign[] {
  return type === '12month' ? INSPECTION_ITEMS_12MONTH : INSPECTION_ITEMS_24MONTH;
}

/**
 * 点検タイプに応じたカテゴリリストを取得
 */
export function getInspectionCategories(
  type: '12month' | '24month'
): (InspectionCategory12Month | InspectionCategory24Month)[] {
  if (type === '12month') {
    return ['steering', 'brake', 'running', 'suspension', 'drivetrain'];
  } else {
    // 24ヶ月点検では日常点検を除外（任意項目のため）
    return ['engine-room', 'interior', 'chassis', 'underbody', 'exterior'];
  }
}

/**
 * 進捗を計算（完了した項目数と全体の項目数）
 * 
 * @param items 検査項目リスト（既に日常点検は除外されている想定）
 * @param type 点検タイプ（未使用だが互換性のため残す）
 */
export function calculateProgress(
  items: InspectionItemRedesign[],
  type?: '12month' | '24month'
): { completed: number; total: number; percentage: number } {
  // 24ヶ月点検では日常点検はデータソースから既に除外されているため、フィルタリング不要
  const total = items.length;
  const completed = items.filter(item => item.status !== 'none').length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return { completed, total, percentage };
}

/**
 * カテゴリごとの進捗を計算
 */
export function calculateCategoryProgress(
  category: InspectionCategory12Month | InspectionCategory24Month,
  items: InspectionItemRedesign[],
  type?: '12month' | '24month'
): { completed: number; total: number; percentage: number } {
  const categoryItems = items.filter(item => item.category === category);
  return calculateProgress(categoryItems, type);
}

/**
 * 異常項目（交換、調整、修理が必要な項目）を取得
 */
export function getAbnormalItems(
  items: InspectionItemRedesign[]
): InspectionItemRedesign[] {
  return items.filter(item => 
    item.status === 'exchange' || 
    item.status === 'adjust' || 
    item.status === 'repair' ||
    item.status === 'tighten' ||
    item.status === 'clean' ||
    item.status === 'specific'
  );
}

