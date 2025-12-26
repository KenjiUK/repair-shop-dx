/**
 * 写真位置マッピングとファイル名生成関数のテスト
 */

import {
  PHOTO_POSITION_MAP,
  BLOG_PHOTO_POSITIONS,
  INTAKE_PHOTO_POSITIONS,
  getPhotoPositionLabel,
  generateInternalPhotoFileName,
} from "../photo-position";
import { generateBlogPhotoFileName } from "../blog-photo-manager";

describe("photo-position", () => {
  describe("PHOTO_POSITION_MAP", () => {
    it("全ての位置が正しくマッピングされている", () => {
      expect(PHOTO_POSITION_MAP.front).toBe("前面");
      expect(PHOTO_POSITION_MAP.rear).toBe("後面");
      expect(PHOTO_POSITION_MAP.left).toBe("左側面");
      expect(PHOTO_POSITION_MAP.right).toBe("右側面");
      expect(PHOTO_POSITION_MAP.engine).toBe("エンジンルーム");
      expect(PHOTO_POSITION_MAP.interior).toBe("内装");
      expect(PHOTO_POSITION_MAP.damage).toBe("傷・凹み");
      expect(PHOTO_POSITION_MAP.other).toBe("その他");
    });
  });

  describe("getPhotoPositionLabel", () => {
    it("英語キーから日本語ラベルを取得できる", () => {
      expect(getPhotoPositionLabel("front")).toBe("前面");
      expect(getPhotoPositionLabel("rear")).toBe("後面");
      expect(getPhotoPositionLabel("left")).toBe("左側面");
      expect(getPhotoPositionLabel("right")).toBe("右側面");
      expect(getPhotoPositionLabel("engine")).toBe("エンジンルーム");
      expect(getPhotoPositionLabel("interior")).toBe("内装");
      expect(getPhotoPositionLabel("damage")).toBe("傷・凹み");
      expect(getPhotoPositionLabel("other")).toBe("その他");
    });

    it("未知のキーの場合はそのまま返す", () => {
      expect(getPhotoPositionLabel("unknown")).toBe("unknown");
    });
  });

  describe("generateInternalPhotoFileName", () => {
    it("日本語ファイル名を正しく生成する", () => {
      const fileName = generateInternalPhotoFileName(
        "20241225",
        "プジョー308",
        "12ヶ月点検",
        "front",
        0,
        "photo.jpg"
      );
      expect(fileName).toBe("00_前面_20241225_12ヶ月点検_プジョー308.jpg");
    });

    it("位置番号が正しくゼロ埋めされる", () => {
      const fileName = generateInternalPhotoFileName(
        "20241225",
        "プジョー308",
        "12ヶ月点検",
        "rear",
        5,
        "photo.jpg"
      );
      expect(fileName).toBe("05_後面_20241225_12ヶ月点検_プジョー308.jpg");
    });

    it("特殊文字が適切に処理される", () => {
      const fileName = generateInternalPhotoFileName(
        "20241225",
        "シトロエン/C3",
        "コーティング/施工",
        "left",
        0,
        "photo.jpg"
      );
      expect(fileName).toMatch(/^00_左側面_20241225_/);
      expect(fileName).not.toContain("/");
    });

    it("全ての位置で正しく生成される", () => {
      const positions: Array<{ key: string; expectedLabel: string }> = [
        { key: "front", expectedLabel: "前面" },
        { key: "rear", expectedLabel: "後面" },
        { key: "left", expectedLabel: "左側面" },
        { key: "right", expectedLabel: "右側面" },
        { key: "engine", expectedLabel: "エンジンルーム" },
        { key: "interior", expectedLabel: "内装" },
        { key: "damage", expectedLabel: "傷・凹み" },
        { key: "other", expectedLabel: "その他" },
      ];

      positions.forEach(({ key, expectedLabel }) => {
        const fileName = generateInternalPhotoFileName(
          "20241225",
          "テスト車",
          "テスト作業",
          key,
          0,
          "photo.jpg"
        );
        expect(fileName).toContain(expectedLabel);
      });
    });
  });

  describe("generateBlogPhotoFileName", () => {
    it("英語ファイル名を正しく生成する", () => {
      const fileName = generateBlogPhotoFileName(
        "20241225",
        "プジョー308",
        "12ヶ月点検",
        "front",
        0,
        "photo.jpg"
      );
      expect(fileName).toBe("00_front_20241225_12month_inspection_Peugeot308.jpg");
    });

    it("位置番号が正しくゼロ埋めされる", () => {
      const fileName = generateBlogPhotoFileName(
        "20241225",
        "プジョー308",
        "12ヶ月点検",
        "rear",
        5,
        "photo.jpg"
      );
      expect(fileName).toBe("05_rear_20241225_12month_inspection_Peugeot308.jpg");
    });

    it("特殊文字が適切に処理される", () => {
      const fileName = generateBlogPhotoFileName(
        "20241225",
        "シトロエン/C3",
        "コーティング/施工",
        "left",
        0,
        "photo.jpg"
      );
      expect(fileName).toMatch(/^00_left_20241225_/);
      expect(fileName).not.toContain("/");
    });

    it("全ての位置で正しく生成される", () => {
      const positions = ["front", "rear", "left", "right", "engine", "interior", "damage", "other"];

      positions.forEach((position) => {
        const fileName = generateBlogPhotoFileName(
          "20241225",
          "TestVehicle",
          "TestService",
          position,
          0,
          "photo.jpg"
        );
        expect(fileName).toContain(`00_${position}_`);
      });
    });
  });

  describe("BLOG_PHOTO_POSITIONS", () => {
    it("全ての位置が含まれている", () => {
      const positionKeys = BLOG_PHOTO_POSITIONS.map((p) => p.position);
      expect(positionKeys).toContain("front");
      expect(positionKeys).toContain("rear");
      expect(positionKeys).toContain("left");
      expect(positionKeys).toContain("right");
      expect(positionKeys).toContain("engine");
      expect(positionKeys).toContain("interior");
      expect(positionKeys).toContain("damage");
      expect(positionKeys).toContain("other");
    });

    it("各位置のラベルが正しい", () => {
      const frontPosition = BLOG_PHOTO_POSITIONS.find((p) => p.position === "front");
      expect(frontPosition?.label).toBe("前面");
    });
  });

  describe("INTAKE_PHOTO_POSITIONS", () => {
    it("基本的な4方向が含まれている", () => {
      const positionKeys = INTAKE_PHOTO_POSITIONS.map((p) => p.position);
      expect(positionKeys).toContain("front");
      expect(positionKeys).toContain("rear");
      expect(positionKeys).toContain("left");
      expect(positionKeys).toContain("right");
    });

    it("4方向のみが含まれている", () => {
      expect(INTAKE_PHOTO_POSITIONS.length).toBe(4);
    });
  });
});

