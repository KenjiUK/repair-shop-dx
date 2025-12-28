/**
 * 車両メーカー抽出ユーティリティ
 * 
 * 車両名からメーカーを特定し、Simple Iconsのスラッグを返す
 */

/**
 * 車両名からメーカーを抽出
 * @param vehicleName 車両名（例: "Toyota Yaris", "BMW 116i", "Peugeot 307SW"）
 * @returns Simple Iconsのスラッグ（メーカーが特定できない場合はnull）
 */
export function extractManufacturer(vehicleName: string): string | null {
  if (!vehicleName) return null;

  // 正規化: 全角・半角スペース、中点（・）、ハイフンを削除
  // 全角スペース（\u3000）も含めてすべての空白文字を削除
  const normalized = vehicleName
    .toLowerCase()
    .trim()
    .replace(/[・･]/g, "") // 全角・半角中点を削除
    .replace(/[\s\u3000]+/g, "") // すべてのスペース（全角・半角）を削除
    .replace(/[-ー]/g, ""); // ハイフンと長音記号を削除

  // メーカー名のマッピング（Simple Iconsのスラッグ）
  // より具体的なキーワードを先に配置（長いキーワード優先）
  const manufacturerMap: Record<string, string> = {
    // 日本メーカー
    "toyota": "toyota",
    "トヨタ": "toyota",
    "lexus": "lexus",
    "レクサス": "lexus",
    "honda": "honda",
    "ホンダ": "honda",
    "nissan": "nissan",
    "日産": "nissan",
    "datsun": "datsun",
    "ダットサン": "datsun",
    "mazda": "mazda",
    "マツダ": "mazda",
    "subaru": "subaru",
    "スバル": "subaru",
    "mitsubishi": "mitsubishi",
    "三菱": "mitsubishi",
    "suzuki": "suzuki",
    "スズキ": "suzuki",
    "daihatsu": "daihatsu",
    "ダイハツ": "daihatsu",
    "isuzu": "isuzu",
    "いすゞ": "isuzu",
    "hino": "hino",
    "日野": "hino",
    "yamaha": "yamaha",
    "ヤマハ": "yamaha",
    "kawasaki": "kawasaki",
    "カワサキ": "kawasaki",

    // ドイツメーカー
    "bmw": "bmw",
    "ビーエムダブリュー": "bmw",
    // メルセデス・ベンツ: より具体的なキーワードを先に配置
    "mercedes-benz": "mercedes",
    "メルセデスベンツ": "mercedes", // 中点なしのパターンも追加
    "mercedes": "mercedes",
    "メルセデス": "mercedes",
    "benz": "mercedes",
    "ベンツ": "mercedes",
    "audi": "audi",
    "アウディ": "audi",
    "volkswagen": "volkswagen",
    "vw": "volkswagen",
    "フォルクスワーゲン": "volkswagen",
    "porsche": "porsche",
    "ポルシェ": "porsche",
    "opel": "opel",
    "オペル": "opel",

    // フランスメーカー
    "peugeot": "peugeot",
    "プジョー": "peugeot",
    "citroen": "citroen",
    "citroën": "citroen",
    "シトロエン": "citroen",
    "renault": "renault",
    "ルノー": "renault",
    "alpine": "alpine",
    "アルピーヌ": "alpine",

    // イタリアメーカー
    "fiat": "fiat",
    "フィアット": "fiat",
    "ferrari": "ferrari",
    "フェラーリ": "ferrari",
    "lamborghini": "lamborghini",
    "ランボルギーニ": "lamborghini",
    "maserati": "maserati",
    "マセラティ": "maserati",
    "alfa romeo": "alfaromeo",
    "アルファロメオ": "alfaromeo",
    "lancia": "lancia",
    "ランチア": "lancia",

    // イギリスメーカー
    "jaguar": "jaguar",
    "ジャガー": "jaguar",
    "land rover": "landrover",
    "ランドローバー": "landrover",
    "mini": "mini",
    "ミニ": "mini",
    "bentley": "bentley",
    "ベントレー": "bentley",
    "rolls-royce": "rollsroyce",
    "ロールスロイス": "rollsroyce",
    "aston martin": "astonmartin",
    "アストンマーティン": "astonmartin",
    "lotus": "lotus",
    "ロータス": "lotus",
    "mclaren": "mclaren",
    "マクラーレン": "mclaren",

    // アメリカメーカー
    "ford": "ford",
    "フォード": "ford",
    "chevrolet": "chevrolet",
    "シボレー": "chevrolet",
    "chevy": "chevrolet",
    "cadillac": "cadillac",
    "キャデラック": "cadillac",
    "dodge": "dodge",
    "ダッジ": "dodge",
    "jeep": "jeep",
    "ジープ": "jeep",
    "chrysler": "chrysler",
    "クライスラー": "chrysler",
    "tesla": "tesla",
    "テスラ": "tesla",
    "lincoln": "lincoln",
    "リンカーン": "lincoln",

    // 韓国メーカー
    "hyundai": "hyundai",
    "ヒュンダイ": "hyundai",
    "kia": "kia",
    "キア": "kia",
    "genesis": "genesis",
    "ジェネシス": "genesis",

    // 中国メーカー
    "byd": "byd",
    "geely": "geely",
    "吉利": "geely",
    "great wall": "greatwall",
    "長城": "greatwall",

    // その他
    "volvo": "volvo",
    "ボルボ": "volvo",
    "saab": "saab",
    "サーブ": "saab",
    "skoda": "skoda",
    "スコダ": "skoda",
    "seat": "seat",
    "セアト": "seat",
  };

  // 車両名からメーカーを検索
  // より柔軟なマッチング: 正規化された文字列と、キーワードの正規化版を比較
  // 長いキーワードを優先的にチェック（より具体的なマッチングのため）
  const sortedEntries = Object.entries(manufacturerMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [keyword, slug] of sortedEntries) {
    // キーワードも同様に正規化（中点、スペース、ハイフンを削除）
    const normalizedKeyword = keyword
      .toLowerCase()
      .replace(/[・･]/g, "") // 全角・半角中点を削除
      .replace(/[\s\u3000]+/g, "") // すべてのスペース（全角・半角）を削除
      .replace(/[-ー]/g, ""); // ハイフンと長音記号を削除
    
    // 正規化された文字列に正規化されたキーワードが含まれるかチェック
    if (normalizedKeyword && normalizedKeyword.length > 0 && normalized.includes(normalizedKeyword)) {
      // デバッグ用（開発環境のみ）
      if (process.env.NODE_ENV === "development" && vehicleName.includes("メルセデス")) {
        console.log("extractManufacturer matched:", {
          vehicleName,
          normalized,
          keyword,
          normalizedKeyword,
          slug,
        });
      }
      return slug;
    }
  }

  // デバッグ用（開発環境のみ）
  if (process.env.NODE_ENV === "development" && vehicleName.includes("メルセデス")) {
    console.log("extractManufacturer no match:", {
      vehicleName,
      normalized,
    });
  }

  return null;
}

/**
 * Simple Iconsで利用可能なメーカースラッグのリスト
 */
export const AVAILABLE_MANUFACTURERS = [
  "toyota", "lexus", "honda", "nissan", "datsun", "mazda", "subaru",
  "mitsubishi", "suzuki", "daihatsu", "isuzu", "hino", "yamaha", "kawasaki",
  "bmw", "mercedes", "audi", "volkswagen", "porsche", "opel",
  "peugeot", "citroen", "renault", "alpine",
  "fiat", "ferrari", "lamborghini", "maserati", "alfaromeo", "lancia",
  "jaguar", "landrover", "mini", "bentley", "rollsroyce", "astonmartin", "lotus", "mclaren",
  "ford", "chevrolet", "cadillac", "dodge", "jeep", "chrysler", "tesla", "lincoln",
  "hyundai", "kia", "genesis",
  "byd", "geely", "greatwall",
  "volvo", "saab", "skoda", "seat",
] as const;

