/**
 * PDF座標定義
 * 
 * A4サイズのPDF（左下原点）を想定した座標データ
 * 単位: ポイント（pt）
 */

export const PDF_COORDINATES = {
  // ヘッダー情報
  header: {
    registrationNumber: { x: 460, y: 805, size: 10 }, // 登録番号
    chassisNumber: { x: 460, y: 780, size: 10 },      // 車台番号
    carModel: { x: 320, y: 805, size: 10 },           // 車名及び型式
    engineType: { x: 320, y: 780, size: 10 },         // 原動機型式
    ownerName: { x: 100, y: 805, size: 10 },          // 使用者氏名
    ownerAddress: { x: 100, y: 780, size: 9 },        // 住所
    mileage: { x: 430, y: 760, size: 10 },            // 走行距離
  },
  // 下部数値入力 (CO/HC)
  measurements: {
    coConcentration: { x: 90, y: 108, size: 11 },     // CO %
    hcConcentration: { x: 90, y: 85, size: 11 },      // HC ppm
  },
  // 中央下部: タイヤ・ブレーキ
  inspectData: {
    tire: {
      frontLeft:  { x: 260, y: 120, size: 10 },
      frontRight: { x: 350, y: 120, size: 10 },
      rearLeft:   { x: 260, y: 105, size: 10 },
      rearRight:  { x: 350, y: 105, size: 10 },
    },
    brake: {
      frontLeft:  { x: 260, y: 80, size: 10 },
      frontRight: { x: 350, y: 80, size: 10 },
      rearLeft:   { x: 260, y: 65, size: 10 },
      rearRight:  { x: 350, y: 65, size: 10 },
    },
  },
  // 右側: 交換部品等
  exchangeParts: {
    engineOilQty: { x: 560, y: 435, size: 10 },
    oilFilterQty: { x: 560, y: 410, size: 10 },
    llcQty:       { x: 560, y: 385, size: 10 },
    brakeFluidQty:{ x: 560, y: 360, size: 10 },
  },
  // フッター: 日付・署名
  footer: {
    dateYear:  { x: 440, y: 125, size: 10 },
    dateMonth: { x: 480, y: 125, size: 10 },
    dateDay:   { x: 510, y: 125, size: 10 },
    finishYear:  { x: 440, y: 85, size: 10 },
    finishMonth: { x: 480, y: 85, size: 10 },
    finishDay:   { x: 510, y: 85, size: 10 },
    mechanicName: { x: 440, y: 45, size: 11 },
  }
};

