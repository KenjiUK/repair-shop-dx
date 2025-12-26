/**
 * メーカー問い合わせセクション
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 * 
 * 機能:
 * - メーカーへの問い合わせ内容の記録
 * - メーカーからの回答の記録
 * - 問い合わせ履歴の管理
 * - 問い合わせ方法（メール、電話、FAX等）の記録
 * - 添付ファイルの管理
 */

"use client";

import { useState } from "react";
import { Plus, X, Mail, Phone, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ManufacturerInquiry, InquiryItem } from "@/types";

export interface ManufacturerInquirySectionProps {
  /** メーカー問い合わせデータ */
  inquiry: ManufacturerInquiry | null;
  /** 変更時のコールバック */
  onChange: (inquiry: ManufacturerInquiry) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 問い合わせ項目コンポーネント
 */
function InquiryItemCard({
  inquiry,
  onUpdate,
  onRemove,
  disabled,
}: {
  inquiry: InquiryItem;
  onUpdate: (updates: Partial<InquiryItem>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const getStatusBadgeVariant = (status: InquiryItem["status"]) => {
    switch (status) {
      case "resolved":
        return "default";
      case "responded":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: InquiryItem["status"]) => {
    switch (status) {
      case "pending":
        return "回答待ち";
      case "responded":
        return "回答済み";
      case "resolved":
        return "解決済み";
    }
  };

  const getMethodIcon = (method: InquiryItem["inquiryMethod"]) => {
    switch (method) {
      case "email":
        return Mail;
      case "phone":
        return Phone;
      case "fax":
        return FileText;
      default:
        return FileText;
    }
  };

  const getMethodLabel = (method: InquiryItem["inquiryMethod"]) => {
    switch (method) {
      case "email":
        return "メール";
      case "phone":
        return "電話";
      case "fax":
        return "FAX";
      default:
        return "その他";
    }
  };

  const MethodIcon = getMethodIcon(inquiry.inquiryMethod);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MethodIcon className="h-4 w-4 text-slate-700" />
            <CardTitle className="text-base font-semibold">
              {new Date(inquiry.inquiryDate).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })} - {inquiry.manufacturer}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(inquiry.status)}>
              {getStatusLabel(inquiry.status)}
            </Badge>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 問い合わせ方法 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>問い合わせ方法</Label>
            <Select
              value={inquiry.inquiryMethod}
              onValueChange={(value: InquiryItem["inquiryMethod"]) =>
                onUpdate({ inquiryMethod: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">メール</SelectItem>
                <SelectItem value="phone">電話</SelectItem>
                <SelectItem value="fax">FAX</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>担当者名</Label>
            <Input
              value={inquiry.contactPerson || ""}
              onChange={(e) => onUpdate({ contactPerson: e.target.value || null })}
              placeholder="担当者名"
              disabled={disabled}
            />
          </div>
        </div>

        {/* 問い合わせ内容 */}
        <div className="space-y-2">
          <Label>問い合わせ内容</Label>
          <Textarea
            value={inquiry.inquiryContent}
            onChange={(e) => onUpdate({ inquiryContent: e.target.value })}
            placeholder="問い合わせ内容を入力"
            disabled={disabled}
            rows={4}
          />
        </div>

        {/* 回答内容 */}
        <div className="space-y-2">
          <Label>回答内容</Label>
          <Textarea
            value={inquiry.responseContent || ""}
            onChange={(e) => onUpdate({ responseContent: e.target.value || null })}
            placeholder="回答内容を入力"
            disabled={disabled || inquiry.status === "pending"}
            rows={4}
          />
        </div>

        {/* 回答日時 */}
        {inquiry.responseDate && (
          <div className="flex items-center gap-2 text-base text-slate-800">
            <Clock className="h-4 w-4" />
            <span>
              回答日時:{" "}
              {new Date(inquiry.responseDate).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* ステータス更新ボタン */}
        {!disabled && (
          <div className="flex items-center gap-2">
            {inquiry.status === "pending" && inquiry.responseContent && (
              <Button
                variant="outline"
                onClick={() => {
                  onUpdate({
                    status: "responded",
                    responseDate: new Date().toISOString(),
                  });
                }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                回答済みに更新
              </Button>
            )}
            {inquiry.status === "responded" && (
              <Button
                variant="outline"
                onClick={() => {
                  onUpdate({ status: "resolved" });
                }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                解決済みに更新
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * メーカー問い合わせセクション
 */
export function ManufacturerInquirySection({
  inquiry: initialInquiry,
  onChange,
  disabled = false,
  className,
}: ManufacturerInquirySectionProps) {
  const [inquiry, setInquiry] = useState<ManufacturerInquiry>(
    initialInquiry || {
      inquiries: [],
      lastUpdatedAt: new Date().toISOString(),
    }
  );

  // 初期値が変更されたときに更新
  if (initialInquiry && initialInquiry !== inquiry) {
    setInquiry(initialInquiry);
  }

  const handleAddInquiry = () => {
    const newInquiry: InquiryItem = {
      id: `inquiry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      inquiryDate: new Date().toISOString(),
      inquiryContent: "",
      inquiryMethod: "email",
      manufacturer: "",
      contactPerson: null,
      responseDate: null,
      responseContent: null,
      status: "pending",
      attachments: [],
    };

    const updatedInquiry: ManufacturerInquiry = {
      ...inquiry,
      inquiries: [newInquiry, ...inquiry.inquiries],
      lastUpdatedAt: new Date().toISOString(),
    };

    setInquiry(updatedInquiry);
    onChange(updatedInquiry);
  };

  const handleRemoveInquiry = (inquiryId: string) => {
    const updatedInquiry: ManufacturerInquiry = {
      ...inquiry,
      inquiries: inquiry.inquiries.filter((i) => i.id !== inquiryId),
      lastUpdatedAt: new Date().toISOString(),
    };

    setInquiry(updatedInquiry);
    onChange(updatedInquiry);
  };

  const handleUpdateInquiry = (inquiryId: string, updates: Partial<InquiryItem>) => {
    const updatedInquiry: ManufacturerInquiry = {
      ...inquiry,
      inquiries: inquiry.inquiries.map((i) =>
        i.id === inquiryId
          ? { ...i, ...updates }
          : i
      ),
      lastUpdatedAt: new Date().toISOString(),
    };

    setInquiry(updatedInquiry);
    onChange(updatedInquiry);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-900">メーカー問い合わせ</h3>
        </div>
        {!disabled && (
          <Button
            variant="outline"
            onClick={handleAddInquiry}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            問い合わせを追加
          </Button>
        )}
      </div>

      {inquiry.inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-700">
            <Phone className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>メーカーへの問い合わせがありません</p>
            {!disabled && (
              <Button
                variant="outline"
                onClick={handleAddInquiry}
                className="mt-4"
              >
                問い合わせを追加
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiry.inquiries.map((inquiryItem) => (
            <InquiryItemCard
              key={inquiryItem.id}
              inquiry={inquiryItem}
              onUpdate={(updates) => handleUpdateInquiry(inquiryItem.id, updates)}
              onRemove={() => handleRemoveInquiry(inquiryItem.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* 統計情報 */}
      {inquiry.inquiries.length > 0 && (
        <div className="flex items-center gap-4 text-base text-slate-800">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>回答待ち: {inquiry.inquiries.filter((i) => i.status === "pending").length}件</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>回答済み: {inquiry.inquiries.filter((i) => i.status === "responded").length}件</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <span>解決済み: {inquiry.inquiries.filter((i) => i.status === "resolved").length}件</span>
          </div>
        </div>
      )}
    </div>
  );
}


