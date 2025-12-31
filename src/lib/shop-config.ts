/**
 * 自動車分解整備事業者情報設定
 * 
 * 24ヶ月点検PDFなどで使用する会社情報
 */

/**
 * 自動車分解整備事業者情報
 */
export interface ShopConfig {
  /** 社名 */
  name: string;
  /** 所在地 */
  address: string;
  /** 認証番号 */
  certificationNumber: string;
  /** TEL */
  tel?: string;
  /** FAX */
  fax?: string;
  /** 公式サイト */
  website?: string;
}

/**
 * デフォルトの会社情報
 * 株式会社ワイエムコーポレーション（旧社名：有限会社ワイエムワークス）
 */
export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  name: "株式会社ワイエムコーポレーション（旧社名：有限会社ワイエムワークス）",
  address: "〒587-0011 大阪府堺市美原区丹上469-1",
  certificationNumber: "近運整認大第11614号",
  tel: "072-363-3381",
  fax: "072-350-3867",
  website: "https://ymworks.com/",
};

/**
 * 会社情報を取得
 * 
 * 環境変数から取得を試み、存在しない場合はデフォルト値を使用
 */
export function getShopConfig(): ShopConfig {
  return {
    name: process.env.NEXT_PUBLIC_SHOP_NAME || DEFAULT_SHOP_CONFIG.name,
    address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || DEFAULT_SHOP_CONFIG.address,
    certificationNumber: process.env.NEXT_PUBLIC_SHOP_CERTIFICATION_NUMBER || DEFAULT_SHOP_CONFIG.certificationNumber,
    tel: process.env.NEXT_PUBLIC_SHOP_TEL || DEFAULT_SHOP_CONFIG.tel,
    fax: process.env.NEXT_PUBLIC_SHOP_FAX || DEFAULT_SHOP_CONFIG.fax,
    website: process.env.NEXT_PUBLIC_SHOP_WEBSITE || DEFAULT_SHOP_CONFIG.website,
  };
}

/**
 * PDF用の会社情報文字列を生成
 * 
 * 「自動車分解整備事業者の氏名又は名称及び事業場の所在地並びに認証番号」の形式
 */
export function getShopInfoForPDF(): string {
  const config = getShopConfig();
  return `${config.name}\n${config.address}\n認証番号：${config.certificationNumber}`;
}






