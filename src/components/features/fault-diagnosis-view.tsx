"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoCaptureButton, VideoData } from "@/components/features/video-capture-button";
import { AudioInputButton, AudioData } from "@/components/features/audio-input-button";
import { Button } from "@/components/ui/button";
import { OBDDiagnosticResultSection, OBDDiagnosticResult } from "@/components/features/obd-diagnostic-result-section";
import {
  SymptomCategory,
  Symptom,
  DEFAULT_SYMPTOMS,
  SYMPTOM_CATEGORY_DISPLAY_NAMES,
  getAllSymptomCategories,
  getSymptomsByCategory,
} from "@/lib/fault-diagnosis-types";
import { ErrorLampInfo } from "@/lib/error-lamp-types";
import { AlertTriangle, Video, Mic, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

export interface FaultDiagnosisViewProps {
  /** 選択された症状リスト */
  selectedSymptoms: Symptom[];
  /** 症状選択変更ハンドラ */
  onSymptomChange: (symptoms: Symptom[]) => void;
  /** 診断機結果 */
  diagnosticToolResult?: OBDDiagnosticResult;
  /** 診断機結果変更ハンドラ */
  onDiagnosticToolChange?: (result: OBDDiagnosticResult | undefined) => void;
  /** 動画データマップ */
  videoDataMap?: Record<string, VideoData>;
  /** 動画撮影ハンドラ（音声認識テキスト付き） */
  onVideoCapture?: (position: string, file: File, transcription?: string) => void | Promise<void>;
  /** 音声データ */
  audioData?: AudioData;
  /** 音声録音ハンドラ */
  onAudioCapture?: (audioBlob: Blob) => void | Promise<void>;
  /** 音声削除ハンドラ */
  onAudioRemove?: () => void;
  /** エラーランプ情報（受付時に入力されたもの） */
  errorLampInfo?: ErrorLampInfo;
  /** 追加メモ */
  notes?: string;
  /** メモ変更ハンドラ */
  onNotesChange?: (notes: string) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function FaultDiagnosisView({
  selectedSymptoms,
  onSymptomChange,
  diagnosticToolResult,
  onDiagnosticToolChange,
  videoDataMap = {},
  onVideoCapture,
  audioData,
  onAudioCapture,
  onAudioRemove,
  errorLampInfo,
  notes = "",
  onNotesChange,
  disabled = false,
}: FaultDiagnosisViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>("エンジン");

  // デフォルト症状リストをID付きに変換
  const allSymptoms: Symptom[] = DEFAULT_SYMPTOMS.map((s, index) => ({
    ...s,
    id: `symptom-${index}`,
  }));

  // カテゴリ別症状リスト
  const categorySymptoms = getSymptomsByCategory(allSymptoms, selectedCategory);

  // 症状の選択/解除
  const handleSymptomToggle = (symptom: Symptom) => {
    if (disabled) return;

    const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
    if (isSelected) {
      onSymptomChange(selectedSymptoms.filter((s) => s.id !== symptom.id));
    } else {
      onSymptomChange([...selectedSymptoms, symptom]);
    }
  };

  // カテゴリの選択数
  const getCategorySelectedCount = (category: SymptomCategory) => {
    return selectedSymptoms.filter((s) => s.category === category).length;
  };

  return (
    <div className="space-y-4">
      {/* エラーランプ情報（受付時に入力されたもの） */}
      {errorLampInfo && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
              エラーランプ情報（受付時）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-slate-800">
                  エラーランプ:
                </span>
                <span className="text-base text-slate-700">
                  {errorLampInfo.hasErrorLamp ? "点灯" : "点灯なし"}
                </span>
              </div>
              {errorLampInfo.hasErrorLamp && errorLampInfo.lampTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {errorLampInfo.lampTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 text-base font-medium bg-amber-100 text-amber-900 rounded-md"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
              {errorLampInfo.otherDetails && (
                <div className="text-base text-slate-700">
                  <span className="font-medium">その他:</span> {errorLampInfo.otherDetails}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 症状カテゴリタブ */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-slate-900">症状の選択</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as SymptomCategory)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-slate-100 overflow-x-auto">
              {getAllSymptomCategories().map((category) => {
                const count = getCategorySelectedCount(category);
                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="relative text-base font-medium"
                    disabled={disabled}
                  >
                    {SYMPTOM_CATEGORY_DISPLAY_NAMES[category]}
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-base font-medium bg-primary text-primary-foreground rounded-full shrink-0 whitespace-nowrap">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {getAllSymptomCategories().map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="space-y-2">
                  {getSymptomsByCategory(allSymptoms, category).map((symptom) => {
                    const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                    return (
                      <div
                        key={symptom.id}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:bg-slate-50"
                        )}
                        onClick={() => handleSymptomToggle(symptom)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                          disabled={disabled}
                        />
                        <Label className="text-base font-normal cursor-pointer flex-1">
                          {symptom.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 診断機結果 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText className="h-5 w-5 shrink-0" />
            診断機結果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OBDDiagnosticResultSection
            result={diagnosticToolResult}
            onUpload={async (file: File) => {
              // OBDDiagnosticResultSectionのonUploadインターフェースに合わせる
              if (onDiagnosticToolChange) {
                const result: OBDDiagnosticResult = {
                  fileId: `diagnostic-${Date.now()}`,
                  fileName: file.name,
                  fileUrl: URL.createObjectURL(file),
                  uploadedAt: new Date().toISOString(),
                  status: "uploaded",
                };
                onDiagnosticToolChange(result);
              }
            }}
            onRemove={() => {
              if (onDiagnosticToolChange) {
                onDiagnosticToolChange(undefined);
              }
            }}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* 動画撮影 */}
      {onVideoCapture && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Video className="h-5 w-5 shrink-0" />
              動画撮影
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <VideoCaptureButton
                position="symptom"
                label="症状の動画（実況解説付き）"
                videoData={videoDataMap["symptom"]}
                enableTranscription={true}
                onCapture={onVideoCapture}
                disabled={disabled}
              />
              <VideoCaptureButton
                position="diagnosis"
                label="診断作業の動画（実況解説付き）"
                videoData={videoDataMap["diagnosis"]}
                enableTranscription={true}
                onCapture={onVideoCapture}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 音声録音 */}
      {onAudioCapture && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Mic className="h-5 w-5 shrink-0" />
              音声録音
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AudioInputButton
              position="diagnosis"
              label="症状の音声録音"
              audioData={audioData}
              onStopRecording={async (position: string, audioBlob: Blob) => {
                await onAudioCapture(audioBlob);
              }}
              disabled={disabled}
            />
            {audioData?.audioUrl && onAudioRemove && (
              <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-base font-medium text-slate-800">録音済み</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAudioRemove}
                  disabled={disabled}
                  className="h-12 text-base font-medium"
                >
                  削除
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 追加メモ */}
      {onNotesChange && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-slate-900">追加メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="診断時の追加情報や気づいた点を入力してください..."
              rows={4}
              disabled={disabled}
              className="text-base"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}























