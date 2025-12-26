import { NextRequest, NextResponse } from "next/server";

/**
 * Gemini APIを使用した音声認識（文字起こし）エンドポイント
 * 
 * 無料モデル: gemini-1.5-flash
 * 用途: 動画の音声をテキストに変換
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const videoFile = formData.get("video") as File | null;

    if (!audioFile && !videoFile) {
      return NextResponse.json(
        { error: "音声ファイルまたは動画ファイルが必要です" },
        { status: 400 }
      );
    }

    // Gemini APIキーを環境変数から取得
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEYが設定されていません");
      return NextResponse.json(
        { error: "APIキーが設定されていません" },
        { status: 500 }
      );
    }

    // 動画ファイルの場合は音声を抽出（簡易実装：動画ファイルをそのまま送信）
    const fileToTranscribe = videoFile || audioFile;
    if (!fileToTranscribe) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const arrayBuffer = await fileToTranscribe.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Gemini APIを呼び出し（無料モデル: gemini-1.5-flash）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "この動画の音声を文字起こししてください。日本語で、整備工場のメカニックが車の点検結果を説明している内容です。技術的な用語は正確に、口語表現は自然な文章に変換してください。",
                },
                {
                  inlineData: {
                    mimeType: fileToTranscribe.type || "video/webm",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API エラー:", errorText);
      return NextResponse.json(
        { error: "音声認識に失敗しました", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // レスポンスからテキストを抽出
    const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!transcribedText) {
      return NextResponse.json(
        { error: "文字起こし結果が取得できませんでした" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: transcribedText.trim(),
    });
  } catch (error) {
    console.error("音声認識エラー:", error);
    return NextResponse.json(
      {
        error: "音声認識処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

