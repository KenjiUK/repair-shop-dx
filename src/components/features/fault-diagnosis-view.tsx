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
  /** 動画撮影ハンドラ */
  onVideoCapture?: (position: string, file: File) => void | Promise<void>;
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              エラーランプ情報（受付時）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  エラーランプ:
                </span>
                <span className="text-sm text-slate-600">
                  {errorLampInfo.hasErrorLamp ? "点灯" : "点灯なし"}
                </span>
              </div>
              {errorLampInfo.hasErrorLamp && errorLampInfo.lampTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {errorLampInfo.lampTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-md"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
              {errorLampInfo.otherDetails && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">その他:</span> {errorLampInfo.otherDetails}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 症状カテゴリタブ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">症状の選択</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as SymptomCategory)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
              {getAllSymptomCategories().map((category) => {
                const count = getCategorySelectedCount(category);
                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="relative"
                    disabled={disabled}
                  >
                    {SYMPTOM_CATEGORY_DISPLAY_NAMES[category]}
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
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
                        <Label className="text-sm font-normal cursor-pointer flex-1">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-5 w-5" />
              動画撮影
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <VideoCaptureButton
                position="symptom"
                label="症状の動画"
                videoData={videoDataMap["symptom"]}
                onCapture={onVideoCapture}
                disabled={disabled}
              />
              <VideoCaptureButton
                position="diagnosis"
                label="診断作業の動画"
                videoData={videoDataMap["diagnosis"]}
                onCapture={onVideoCapture}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 音声録音 */}
      {onAudioCapture && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-5 w-5" />
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
              <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">録音済み</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAudioRemove}
                  disabled={disabled}
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">追加メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="診断時の追加情報や気づいた点を入力してください..."
              rows={4}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}















