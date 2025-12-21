"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, Camera, X } from "lucide-react";
import { fetchJobByTagId, fetchJobByQrCode } from "@/lib/api";
import { ZohoJob } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface SmartTagScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * スマートタグスキャンダイアログ
 * タグIDをスキャンまたは手動入力して、案件を取得し適切な画面に遷移
 */
export function SmartTagScanDialog({
  open,
  onOpenChange,
}: SmartTagScanDialogProps) {
  const [tagId, setTagId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  // ダイアログが開いたら入力欄にフォーカス
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // タグIDまたはQRコードから案件を取得して遷移
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!tagId.trim()) {
      toast.error("タグIDまたはQRコードを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      // まずタグIDとして検索を試みる
      let result = await fetchJobByTagId(tagId.trim());
      
      // タグIDで見つからない場合は、QRコードの値として検索
      if (!result.success) {
        result = await fetchJobByQrCode(tagId.trim());
      }
      
      if (!result.success || !result.data) {
        toast.error(result.error?.message || "案件が見つかりませんでした");
        setTagId("");
        return;
      }

      const job = result.data;
      await navigateToJobPage(job);
      
      // 成功したらダイアログを閉じる
      onOpenChange(false);
      setTagId("");
    } catch (error) {
      console.error("タグスキャンエラー:", error);
      toast.error("案件の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 案件のステータスに応じて適切な画面に遷移
  const navigateToJobPage = async (job: ZohoJob) => {
    const status = job.field5 || job.stage;
    
    switch (status) {
      case "入庫待ち":
        // 入庫待ちの場合はチェックイン処理が必要
        // トップページで該当案件を選択してチェックインダイアログを表示
        toast.info("チェックイン処理を行ってください", {
          description: `${job.field4?.name || "顧客"}様の案件`,
        });
        // トップページに遷移して案件をハイライト（URLパラメータで指定）
        router.push(`/?highlight=${job.id}`);
        break;
        
      case "入庫済み":
        // 診断画面に遷移
        router.push(`/mechanic/diagnosis/${job.id}`);
        break;
        
      case "見積作成待ち":
        // 見積作成画面に遷移
        router.push(`/admin/estimate/${job.id}`);
        break;
        
      case "見積提示済み":
        // 顧客承認画面に遷移（デバッグ用）
        router.push(`/customer/approval/${job.id}`);
        break;
        
      case "作業待ち":
        // 作業画面に遷移
        router.push(`/mechanic/work/${job.id}`);
        break;
        
      case "出庫待ち":
        // 出庫処理（トップページで処理）
        toast.info("出庫処理を行ってください", {
          description: `${job.field4?.name || "顧客"}様の案件`,
        });
        router.push(`/?highlight=${job.id}`);
        break;
        
      case "出庫済み":
        // 完了済み（レポート画面）
        router.push(`/customer/report/${job.id}`);
        break;
        
      default:
        toast.warning("不明なステータスです", {
          description: `ステータス: ${status}`,
        });
        // デフォルトは診断画面
        router.push(`/mechanic/diagnosis/${job.id}`);
    }
  };

  // QRコードスキャン開始
  const handleStartScan = async () => {
    if (isScanning) {
      // 既にスキャン中の場合は停止
      handleStopScan();
      return;
    }

    setIsScanning(true);
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      
      // カメラを起動してスキャン開始
      await html5QrCode.start(
        { facingMode: "environment" }, // バックカメラを優先
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QRコードが読み取れたら自動的に停止
          handleQrCodeScanned(decodedText);
        },
        (errorMessage) => {
          // エラーは無視（継続的にスキャンするため）
        }
      );
      
      setScanner(html5QrCode);
    } catch (error: any) {
      console.error("QRコードスキャンエラー:", error);
      setIsScanning(false);
      
      if (error.name === "NotAllowedError") {
        toast.error("カメラへのアクセスが拒否されました", {
          description: "ブラウザの設定でカメラへのアクセスを許可してください",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("カメラが見つかりません", {
          description: "デバイスにカメラが接続されているか確認してください",
        });
      } else {
        toast.error("カメラの起動に失敗しました", {
          description: error.message || "不明なエラーが発生しました",
        });
      }
    }
  };

  // QRコードスキャン停止
  const handleStopScan = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
        setScanner(null);
      } catch (error) {
        console.error("スキャン停止エラー:", error);
      }
    }
    setIsScanning(false);
  };

  // QRコードが読み取られた時の処理
  const handleQrCodeScanned = async (qrCodeValue: string) => {
    // スキャンを停止
    await handleStopScan();
    
    // QRコードの値を入力欄に設定
    setTagId(qrCodeValue);
    
    // 自動的に案件を取得
    setIsLoading(true);
    try {
      // まずQRコードとして検索
      let result = await fetchJobByQrCode(qrCodeValue);
      
      // QRコードで見つからない場合はタグIDとして検索
      if (!result.success) {
        result = await fetchJobByTagId(qrCodeValue);
      }
      
      if (!result.success || !result.data) {
        toast.error(result.error?.message || "案件が見つかりませんでした");
        return;
      }

      const job = result.data;
      await navigateToJobPage(job);
      
      // 成功したらダイアログを閉じる
      onOpenChange(false);
      setTagId("");
    } catch (error) {
      console.error("タグスキャンエラー:", error);
      toast.error("案件の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ダイアログが閉じられた時にスキャンを停止
  useEffect(() => {
    if (!open && scanner) {
      handleStopScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            スマートタグをスキャン
          </DialogTitle>
          <DialogDescription>
            スマートタグに印刷されたQRコードをスキャンするか、タグIDを手動で入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* QRコードスキャンエリア */}
          {isScanning && (
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <Label>QRコードをスキャン中...</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleStopScan}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full rounded-md border border-slate-200 overflow-hidden"
                style={{ minHeight: "300px" }}
              />
              <p className="text-xs text-slate-500 text-center">
                スマートタグのQRコードをカメラに向けてください
              </p>
            </div>
          )}

          {/* 手動入力エリア */}
          {!isScanning && (
            <div className="space-y-2">
              <Label htmlFor="tag-id">タグIDまたはQRコード</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-id"
                  ref={inputRef}
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="タグID（例: 01, 02...）またはQRコードをスキャン"
                  disabled={isLoading}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleStartScan}
                  disabled={isLoading}
                  title="QRコードをスキャン"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setTagId("");
              }}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !tagId.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  読み込み中...
                </>
              ) : (
                "案件を表示"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}





