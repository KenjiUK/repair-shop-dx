/**
 * 工賃マスタデータ
 * 輸入車ディーラーの最高額を初期データとして使用
 */

export interface LaborCostMasterItem {
  /** 作業内容ID */
  id: string;
  /** 作業内容名 */
  name: string;
  /** カテゴリー */
  category: string;
  /** 標準作業点数 */
  workPoints: string;
  /** 作業時間 */
  workTime: string;
  /** 工賃（輸入車ディーラー - 最高額） */
  laborCost: number;
}

/**
 * 工賃マスタデータ
 * 輸入車ディーラーの一番高い工賃を使用
 */
export const LABOR_COST_MASTER: LaborCostMasterItem[] = [
  // 🔧 エンジン系統
  {
    id: "engine-oil-change",
    name: "エンジンオイル交換",
    category: "エンジン系統",
    workPoints: "0.2〜0.3点",
    workTime: "12〜18分",
    laborCost: 4500, // 輸入車ディーラー最高額
  },
  {
    id: "oil-filter-change",
    name: "オイルフィルター交換",
    category: "エンジン系統",
    workPoints: "0.1〜0.2点",
    workTime: "6〜12分",
    laborCost: 3000,
  },
  {
    id: "spark-plug-change",
    name: "スパークプラグ交換",
    category: "エンジン系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  {
    id: "air-filter-change",
    name: "エアフィルター交換",
    category: "エンジン系統",
    workPoints: "0.1〜0.2点",
    workTime: "6〜12分",
    laborCost: 3000,
  },
  {
    id: "engine-check",
    name: "エンジンチェック・診断",
    category: "エンジン系統",
    workPoints: "0.5〜1.0点",
    workTime: "30〜60分",
    laborCost: 15000,
  },
  {
    id: "timing-belt-change",
    name: "タイミングベルト交換",
    category: "エンジン系統",
    workPoints: "3.0〜5.0点",
    workTime: "180〜300分",
    laborCost: 75000,
  },
  {
    id: "water-pump-change",
    name: "ウォーターポンプ交換",
    category: "エンジン系統",
    workPoints: "2.0〜3.0点",
    workTime: "120〜180分",
    laborCost: 45000,
  },
  {
    id: "radiator-change",
    name: "ラジエーター交換",
    category: "エンジン系統",
    workPoints: "1.5〜2.5点",
    workTime: "90〜150分",
    laborCost: 37500,
  },
  {
    id: "thermostat-change",
    name: "サーモスタット交換",
    category: "エンジン系統",
    workPoints: "0.8〜1.2点",
    workTime: "48〜72分",
    laborCost: 18000,
  },
  // ⚙️ トランスミッション系統
  {
    id: "mt-oil-change",
    name: "MTオイル交換",
    category: "トランスミッション系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  {
    id: "atf-change",
    name: "ATF（オートマオイル）交換",
    category: "トランスミッション系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "atf-pressure-change",
    name: "ATF圧送交換",
    category: "トランスミッション系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "clutch-change",
    name: "クラッチ交換（MT車）",
    category: "トランスミッション系統",
    workPoints: "2.0〜3.0点",
    workTime: "120〜180分",
    laborCost: 45000,
  },
  {
    id: "cvt-fluid-change",
    name: "CVTフルード交換",
    category: "トランスミッション系統",
    workPoints: "0.8〜1.2点",
    workTime: "48〜72分",
    laborCost: 18000,
  },
  {
    id: "diff-oil-change",
    name: "デフオイル交換",
    category: "トランスミッション系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  // 🛑 ブレーキ系統
  {
    id: "brake-pad-front",
    name: "ブレーキパッド交換（前輪）",
    category: "ブレーキ系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "brake-pad-rear",
    name: "ブレーキパッド交換（後輪）",
    category: "ブレーキ系統",
    workPoints: "0.6〜0.9点",
    workTime: "36〜54分",
    laborCost: 13500,
  },
  {
    id: "brake-rotor-front",
    name: "ブレーキローター交換（前）",
    category: "ブレーキ系統",
    workPoints: "0.8〜1.2点",
    workTime: "48〜72分",
    laborCost: 18000,
  },
  {
    id: "brake-rotor-rear",
    name: "ブレーキローター交換（後）",
    category: "ブレーキ系統",
    workPoints: "0.9〜1.3点",
    workTime: "54〜78分",
    laborCost: 19500,
  },
  {
    id: "brake-fluid-change",
    name: "ブレーキフルード交換",
    category: "ブレーキ系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  {
    id: "brake-caliper-change",
    name: "ブレーキキャリパー交換",
    category: "ブレーキ系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "parking-brake-adjust",
    name: "パーキングブレーキ調整",
    category: "ブレーキ系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  {
    id: "brake-hose-change",
    name: "ブレーキホース交換",
    category: "ブレーキ系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  // 🔩 サスペンション・足回り系統
  {
    id: "shock-absorber-change",
    name: "ショックアブソーバー交換（1本）",
    category: "サスペンション・足回り系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "strut-change",
    name: "ストラット交換（1本）",
    category: "サスペンション・足回り系統",
    workPoints: "1.5〜2.0点",
    workTime: "90〜120分",
    laborCost: 30000,
  },
  {
    id: "stabilizer-link-change",
    name: "スタビライザーリンク交換",
    category: "サスペンション・足回り系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "lower-arm-change",
    name: "ロアアーム交換",
    category: "サスペンション・足回り系統",
    workPoints: "1.5〜2.5点",
    workTime: "90〜150分",
    laborCost: 37500,
  },
  {
    id: "tie-rod-end-change",
    name: "タイロッドエンド交換",
    category: "サスペンション・足回り系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "ball-joint-change",
    name: "ボールジョイント交換",
    category: "サスペンション・足回り系統",
    workPoints: "1.5〜2.0点",
    workTime: "90〜120分",
    laborCost: 30000,
  },
  {
    id: "wheel-alignment",
    name: "ホイールアライメント調整",
    category: "サスペンション・足回り系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "hub-bearing-change",
    name: "ハブベアリング交換",
    category: "サスペンション・足回り系統",
    workPoints: "1.5〜2.5点",
    workTime: "90〜150分",
    laborCost: 37500,
  },
  // ⚡ 電装系統
  {
    id: "battery-change",
    name: "バッテリー交換",
    category: "電装系統",
    workPoints: "0.2〜0.3点",
    workTime: "12〜18分",
    laborCost: 4500,
  },
  {
    id: "alternator-change",
    name: "オルタネーター交換",
    category: "電装系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "starter-motor-change",
    name: "スターターモーター交換",
    category: "電装系統",
    workPoints: "1.2〜1.8点",
    workTime: "72〜108分",
    laborCost: 27000,
  },
  {
    id: "headlight-bulb-change",
    name: "ヘッドライトバルブ交換",
    category: "電装系統",
    workPoints: "0.2〜0.5点",
    workTime: "12〜30分",
    laborCost: 7500,
  },
  {
    id: "wiper-blade-change",
    name: "ワイパーブレード交換",
    category: "電装系統",
    workPoints: "0.1点",
    workTime: "6分",
    laborCost: 1000,
  },
  {
    id: "ac-gas-refill",
    name: "エアコンガス補充",
    category: "電装系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "ac-compressor-change",
    name: "エアコンコンプレッサー交換",
    category: "電装系統",
    workPoints: "2.0〜3.0点",
    workTime: "120〜180分",
    laborCost: 45000,
  },
  {
    id: "ignition-coil-change",
    name: "イグニッションコイル交換",
    category: "電装系統",
    workPoints: "0.3〜0.6点",
    workTime: "18〜36分",
    laborCost: 9000,
  },
  // 🚗 タイヤ・ホイール系統
  {
    id: "tire-change-4",
    name: "タイヤ交換（4本）",
    category: "タイヤ・ホイール系統",
    workPoints: "0.8〜1.2点",
    workTime: "48〜72分",
    laborCost: 18000,
  },
  {
    id: "tire-remove-4",
    name: "タイヤ脱着（4本）",
    category: "タイヤ・ホイール系統",
    workPoints: "0.4〜0.6点",
    workTime: "24〜36分",
    laborCost: 9000,
  },
  {
    id: "tire-rotation",
    name: "タイヤローテーション",
    category: "タイヤ・ホイール系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  {
    id: "wheel-balance-4",
    name: "ホイールバランス調整（4本）",
    category: "タイヤ・ホイール系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "puncture-repair",
    name: "パンク修理",
    category: "タイヤ・ホイール系統",
    workPoints: "0.3〜0.5点",
    workTime: "18〜30分",
    laborCost: 7500,
  },
  // 🛢️ 燃料・排気系統
  {
    id: "fuel-filter-change",
    name: "フューエルフィルター交換",
    category: "燃料・排気系統",
    workPoints: "0.5〜0.8点",
    workTime: "30〜48分",
    laborCost: 12000,
  },
  {
    id: "fuel-pump-change",
    name: "燃料ポンプ交換",
    category: "燃料・排気系統",
    workPoints: "2.0〜3.0点",
    workTime: "120〜180分",
    laborCost: 45000,
  },
  {
    id: "muffler-change",
    name: "マフラー交換",
    category: "燃料・排気系統",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
  {
    id: "catalyst-converter-change",
    name: "触媒コンバーター交換",
    category: "燃料・排気系統",
    workPoints: "1.5〜2.5点",
    workTime: "90〜150分",
    laborCost: 37500,
  },
  {
    id: "o2-sensor-change",
    name: "O2センサー交換",
    category: "燃料・排気系統",
    workPoints: "0.5〜1.0点",
    workTime: "30〜60分",
    laborCost: 15000,
  },
  // 🔧 その他整備項目
  {
    id: "inspection-12month",
    name: "12ヶ月点検（法定点検）",
    category: "その他整備項目",
    workPoints: "1.5〜2.0点",
    workTime: "90〜120分",
    laborCost: 30000,
  },
  {
    id: "inspection-24month",
    name: "24ヶ月点検（車検）",
    category: "その他整備項目",
    workPoints: "2.5〜3.5点",
    workTime: "150〜210分",
    laborCost: 52500,
  },
  {
    id: "engine-room-wash",
    name: "エンジンルーム洗浄",
    category: "その他整備項目",
    workPoints: "0.5〜1.0点",
    workTime: "30〜60分",
    laborCost: 15000,
  },
  {
    id: "underbody-wash",
    name: "下回り洗浄・防錆処理",
    category: "その他整備項目",
    workPoints: "1.0〜1.5点",
    workTime: "60〜90分",
    laborCost: 22500,
  },
];

/**
 * カテゴリー別に工賃マスタを取得
 */
export function getLaborCostByCategory(category: string): LaborCostMasterItem[] {
  return LABOR_COST_MASTER.filter((item) => item.category === category);
}

/**
 * IDで工賃マスタを取得
 */
export function getLaborCostById(id: string): LaborCostMasterItem | undefined {
  return LABOR_COST_MASTER.find((item) => item.id === id);
}

/**
 * 作業内容名で工賃マスタを検索
 */
export function searchLaborCostByName(query: string): LaborCostMasterItem[] {
  const lowerQuery = query.toLowerCase();
  return LABOR_COST_MASTER.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
  );
}




