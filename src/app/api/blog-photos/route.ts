import { NextRequest, NextResponse } from "next/server";
import { listBlogPhotos, BlogPhotoCategory } from "@/lib/blog-photo-manager";

/**
 * GET /api/blog-photos
 * ブログ写真一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") as BlogPhotoCategory | null;
    const folderPath = searchParams.get("folderPath") || undefined;

    const photos = await listBlogPhotos(
      category || undefined,
      folderPath
    );

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("ブログ写真一覧取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "ブログ写真の取得に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}





