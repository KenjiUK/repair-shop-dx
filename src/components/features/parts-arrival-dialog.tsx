"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Package, MessageCircle, Mail, Phone, ExternalLink } from "lucide-react";
import { PartsListItem } from "./parts-list-input";

// =============================================================================
// Types
// =============================================================================

export type ContactMethod = "line" | "email" | "phone";

export interface PartsArrivalDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログの開閉ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** 到着した部品リスト */
  arrivedParts: PartsListItem[];
  /** 連絡送信ハンドラ */
  onSendContact: (method: ContactMethod, message: string) => Promise<void>;
  /** Zoho Bookings予約リンク（オプション） */
  bookingLink?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PartsArrivalDialog({
  open,
  onOpenChange,
  customerName,
  vehicleName,
  arrivedParts,
  onSendContact,
  bookingLink,
}: PartsArrivalDialogProps) {
  const [contactMethod, setContactMethod] = useState<ContactMethod>("line");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // メッセージテンプレートを生成
  const generateMessageTemplate = (method: ContactMethod): string => {
    const partsList = arrivedParts
      .map((part) => `・${part.name}${part.quantity > 1 ? ` × ${part.quantity}` : ""}`)
      .join("\n");

    const baseMessage = `${customerName}様

お待たせしております。
発注していた部品が全て到着いたしました。

【到着部品一覧】
${partsList}

以下のリンクから、ご都合の良い日時で再入庫の予約をお願いいたします。`;

    if (bookingLink) {
      return `${baseMessage}

${bookingLink}`;
    }

    return baseMessage;
  };

  // ダイアログが開いたときにメッセージを初期化
  useEffect(() => {
    if (open) {
      const template = generateMessageTemplate(contactMethod);
      setMessage(template);
    }
  }, [open, contactMethod, customerName, vehicleName, arrivedParts, bookingLink]);

  // 連絡方法が変更されたらメッセージを更新
  const handleContactMethodChange = (method: ContactMethod) => {
    setContactMethod(method);
    setMessage(generateMessageTemplate(method));
  };

  // 連絡送信
  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onSendContact(contactMethod, message);
      onOpenChange(false);
      // リセット
      setMessage("");
      setContactMethod("line");
    } catch (error) {
      console.error("連絡送信エラー:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" />
            全部品到着確認 - {customerName}様
          </DialogTitle>
          <DialogDescription>
            {vehicleName}の部品が全て到着しました。顧客への連絡を行ってください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 到着部品一覧 */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-green-700 shrink-0" />
              到着部品一覧
            </Label>
            <div className="p-3 bg-green-50 rounded-lg border border-green-300 space-y-2">
              {arrivedParts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between text-base"
                >
                  <span className="text-slate-700">
                    {part.name}
                    {part.quantity > 1 && (
                      <span className="text-slate-700"> × {part.quantity}</span>
                    )}
                  </span>
                  {part.vendor && (
                    <span className="text-base text-slate-700">
                      発注先: {part.vendor}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 連絡方法選択 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">連絡方法</Label>
            <RadioGroup
              value={contactMethod}
              onValueChange={(value) => handleContactMethodChange(value as ContactMethod)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="line" id="line" />
                <Label
                  htmlFor="line"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <MessageCircle className="h-4 w-4 text-green-700 shrink-0" />
                  LINE
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <Mail className="h-4 w-4 text-blue-700 shrink-0" />
                  メール
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <Phone className="h-4 w-4 text-slate-700 shrink-0" />
                  電話
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* メッセージプレビュー */}
          <div className="space-y-2">
            <Label className="text-base font-medium">メッセージ</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="min-h-[200px] font-mono text-base"
              disabled={isSending}
            />
            {bookingLink && (
              <div className="flex items-center gap-2 text-base text-slate-700">
                <ExternalLink className="h-4 w-4 shrink-0" /> {/* h-3 w-3 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                Zoho Bookings予約リンクが含まれています
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? "送信中..." : "連絡を送信"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



