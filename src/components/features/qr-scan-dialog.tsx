"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface QrScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (scannedValue: string) => void; // スキャン成功時のコールバック
}

/**
 * QRコードスキャンダイアログ（シンプル版）
 * カメラを起動してQRコードをスキャンするだけ
 */
export function QrScanDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: QrScanDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  // ダイアログが開いたら自動的にスキャン開始
  useEffect(() => {
    if (open && !isScanning) {
      handleStartScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // QRコードスキャン開始
  const handleStartScan = async () => {
    if (isScanning) {
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
        onOpenChange(false);
      } else if (error.name === "NotFoundError") {
        toast.error("カメラが見つかりません", {
          description: "デバイスにカメラが接続されているか確認してください",
        });
        onOpenChange(false);
      } else {
        toast.error("カメラの起動に失敗しました", {
          description: error.message || "不明なエラーが発生しました",
        });
        onOpenChange(false);
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
    
    // スキャン結果を親コンポーネントに渡す
    onScanSuccess(qrCodeValue);
    
    // ダイアログを閉じる
    onOpenChange(false);
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
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* ヘッダー（閉じるボタンのみ） */}
        <div className="flex items-center justify-end p-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* QRコードスキャンエリア */}
        <div className="relative px-4 pb-4">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full rounded-md border border-slate-200 overflow-hidden"
            style={{ minHeight: "300px" }}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            QRコードをカメラに向けてください
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}





