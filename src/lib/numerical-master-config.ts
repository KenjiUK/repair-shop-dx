/**
 * 数値マスター設定
 * システム内で使用される各種数値のマスターデータを管理
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * 数値マスター設定
 */
export interface NumericalMasterConfig {
  /** 閾値設定 */
  thresholds: {
    /** 長期化承認待ちの閾値（日数） */
    longPendingApprovalDays: number;
    /** 長期化部品調達の閾値（日数） */
    longPartsProcurementDays: number;
    /** 緊急案件の閾値（時間） */
    urgentJobHours: {
      /** 高緊急度の閾値（時間） */
      high: number;
      /** 中緊急度の閾値（時間） */
      medium: number;
    };
    /** タイヤ検査の閾値（mm） */
    tireInspection: {
      /** 法定基準（mm） */
      legalThreshold: number;
      /** 推奨基準（mm） */
      recommendedThreshold: number;
    };
  };
  /** 時間設定 */
  timeSettings: {
    /** 出庫予定時間の推定（入庫から何時間後、時間） */
    estimatedDepartureHours: number;
  };
  /** 料金設定 */
  pricing: {
    /** コーティング料金 */
    coating: {
      /** ハイモースコート エッジ（円） */
      highMoseCoatEdge: number;
      /** ハイモースコート グロウ（円） */
      highMoseCoatGlow: number;
      /** ガードグレイズ（円） */
      guardGraze: number;
    };
    /** コーティングオプション料金 */
    coatingOptions: {
      /** ホイールコーティング（4本セット、円） */
      wheelCoating: number;
      /** ウィンドウ撥水（フロント三面、円） */
      windowWaterRepellent: number;
      /** ヘッドライト研磨・クリアコート（左右2個、円） */
      headlightPolish: number;
      /** インテリアクリーニング（円） */
      interiorCleaning: number;
      /** バンパーコート（1本、円） */
      bumperCoat: number;
      /** ウィンドウフィルム（1面、円） */
      windowFilm: number;
      /** 幌コーティング（円） */
      convertibleTopCoating: number;
    };
    /** 同時施工割引率（%） */
    simultaneousDiscountRate: number;
  };
  /** 消費税設定 */
  tax: {
    /** 消費税率（%） */
    taxRate: number;
  };
  /** メンテナンスメニューの所要時間（分） */
  maintenanceDurations: {
    [key: string]: number;
  };
}

/**
 * デフォルト設定
 */
export const DEFAULT_NUMERICAL_MASTER_CONFIG: NumericalMasterConfig = {
  thresholds: {
    longPendingApprovalDays: 3,
    longPartsProcurementDays: 7,
    urgentJobHours: {
      high: 2,
      medium: 1,
    },
    tireInspection: {
      legalThreshold: 1.6,
      recommendedThreshold: 3.0,
    },
  },
  timeSettings: {
    estimatedDepartureHours: 4,
  },
  pricing: {
    coating: {
      highMoseCoatEdge: 88000,
      highMoseCoatGlow: 88000,
      guardGraze: 81400,
    },
    coatingOptions: {
      wheelCoating: 26400,
      windowWaterRepellent: 25000,
      headlightPolish: 66000,
      interiorCleaning: 39000,
      bumperCoat: 15000,
      windowFilm: 24000,
      convertibleTopCoating: 48000,
    },
    simultaneousDiscountRate: 10,
  },
  tax: {
    taxRate: 10, // 消費税率10%（デフォルト）
  },
  maintenanceDurations: {
    "バッテリー交換": 60,
    "ブレーキフルード交換": 60,
    "エアフィルター交換": 30,
    "クーラント交換": 120,
    "スパークプラグ交換": 120,
    "ベルト類交換": 180,
    "ワイパー交換": 30,
    "ブレーキパッド交換": 120,
    "ブレーキローター交換": 120,
    "オイルフィルター交換": 30,
    "キャビンフィルター交換": 30,
    "ラジエーターキャップ交換": 10,
  },
};

// =============================================================================
// 設定の読み込み・保存
// =============================================================================

const STORAGE_KEY = "numerical-master-config";

/**
 * 数値マスター設定を取得
 * localStorageから読み込み、存在しない場合はデフォルト値を返す
 */
export function getNumericalMasterConfig(): NumericalMasterConfig {
  if (typeof window === "undefined") {
    return DEFAULT_NUMERICAL_MASTER_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NumericalMasterConfig;
      // デフォルト値とマージ（新しい項目が追加された場合に対応）
      return {
        ...DEFAULT_NUMERICAL_MASTER_CONFIG,
        ...parsed,
        thresholds: {
          ...DEFAULT_NUMERICAL_MASTER_CONFIG.thresholds,
          ...parsed.thresholds,
          urgentJobHours: {
            ...DEFAULT_NUMERICAL_MASTER_CONFIG.thresholds.urgentJobHours,
            ...parsed.thresholds?.urgentJobHours,
          },
          tireInspection: {
            ...DEFAULT_NUMERICAL_MASTER_CONFIG.thresholds.tireInspection,
            ...parsed.thresholds?.tireInspection,
          },
        },
        timeSettings: {
          ...DEFAULT_NUMERICAL_MASTER_CONFIG.timeSettings,
          ...parsed.timeSettings,
        },
        pricing: {
          ...DEFAULT_NUMERICAL_MASTER_CONFIG.pricing,
          ...parsed.pricing,
          coating: {
            ...DEFAULT_NUMERICAL_MASTER_CONFIG.pricing.coating,
            ...parsed.pricing?.coating,
          },
          coatingOptions: {
            ...DEFAULT_NUMERICAL_MASTER_CONFIG.pricing.coatingOptions,
            ...parsed.pricing?.coatingOptions,
          },
        },
        tax: {
          ...DEFAULT_NUMERICAL_MASTER_CONFIG.tax,
          ...parsed.tax,
        },
        maintenanceDurations: {
          ...DEFAULT_NUMERICAL_MASTER_CONFIG.maintenanceDurations,
          ...parsed.maintenanceDurations,
        },
      };
    }
  } catch (error) {
    console.error("Failed to load numerical master config:", error);
  }

  return DEFAULT_NUMERICAL_MASTER_CONFIG;
}

/**
 * 数値マスター設定を保存
 */
export function saveNumericalMasterConfig(config: NumericalMasterConfig): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save numerical master config:", error);
    throw new Error("設定の保存に失敗しました");
  }
}

/**
 * 数値マスター設定をリセット（デフォルト値に戻す）
 */
export function resetNumericalMasterConfig(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset numerical master config:", error);
    throw new Error("設定のリセットに失敗しました");
  }
}




