/**
 * 見積テンプレート管理ダイアログ
 * 改善提案 #7: テンプレート機能の実装
 *
 * 機能:
 * - 見積テンプレートの読み込み
 * - 見積テンプレートの保存
 * - 見積テンプレートの削除
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { FileText, Save, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  EstimateTemplate,
  EstimateTemplateItem,
  EstimateItem,
} from "@/types";
import {
  getEstimateTemplates,
  saveEstimateTemplate,
  deleteEstimateTemplate,
  generateTemplateId,
  getCurrentUser,
} from "@/lib/template-storage";

export interface EstimateTemplateDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 現在の見積項目 */
  currentItems: EstimateItem[];
  /** テンプレートから項目を読み込むコールバック */
  onLoadTemplate: (items: EstimateItem[]) => void;
}

/**
 * 見積テンプレート管理ダイアログ
 */
export function EstimateTemplateDialog({
  open,
  onOpenChange,
  currentItems,
  onLoadTemplate,
}: EstimateTemplateDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string | null>(null);

  // テンプレートを読み込み
  useEffect(() => {
    if (!open) return;
    
    // 次のレンダリングサイクルで状態を更新
    const updateTimer = setTimeout(() => {
      setTemplates(getEstimateTemplates());
    }, 0);
    
    return () => clearTimeout(updateTimer);
  }, [open]);

  // フィルタリングされたテンプレート
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        (template.category && template.category.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  // テンプレートを読み込む
  const handleLoadTemplate = (template: EstimateTemplate) => {
    const items: EstimateItem[] = template.items.map((item) => ({
      id: `est-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      price: item.price,
      priority: item.priority,
      selected: false,
      linkedPhotoUrls: [],
      linkedVideoUrl: null,
      note: item.description || null,
    }));

    onLoadTemplate(items);
    toast.success("テンプレートを読み込みました", {
      description: template.name,
    });
    onOpenChange(false);
  };

  // テンプレートを保存
  const handleSaveTemplate = () => {
    if (currentItems.length === 0) {
      toast.error("見積項目がありません");
      return;
    }
    setIsSaveDialogOpen(true);
  };

  // テンプレート保存を確定
  const handleSaveTemplateConfirm = () => {
    if (!templateName.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }

    const template: EstimateTemplate = {
      id: generateTemplateId(),
      name: templateName,
      category: templateCategory,
      items: currentItems.map((item) => ({
        name: item.name,
        description: item.note || null,
        price: item.price,
        quantity: 1,
        priority: item.priority,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: getCurrentUser(),
    };

    saveEstimateTemplate(template);
    setTemplates(getEstimateTemplates());
    setIsSaveDialogOpen(false);
    setTemplateName("");
    setTemplateCategory(null);
    toast.success("テンプレートを保存しました", {
      description: template.name,
    });
  };

  // テンプレートを削除
  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (confirm(`「${template.name}」を削除しますか？`)) {
      deleteEstimateTemplate(templateId);
      setTemplates(getEstimateTemplates());
      toast.success("テンプレートを削除しました", {
        description: template.name,
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              見積テンプレート
            </DialogTitle>
            <DialogDescription>
              よく使う見積項目をテンプレートとして保存・読み込みできます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSaveDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={currentItems.length === 0}
              >
                <Save className="h-4 w-4" />
                現在の見積をテンプレートとして保存
              </Button>
            </div>

            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-700" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="テンプレート名で検索"
                className="pl-10"
              />
            </div>

            {/* テンプレートリスト */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-700">
                {searchQuery
                  ? "検索結果が見つかりませんでした"
                  : "テンプレートがありません"}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{template.name}</div>
                            {template.category && (
                              <div className="text-base text-slate-700 mt-1">
                                {template.category}
                              </div>
                            )}
                            <div className="text-base text-slate-700 mt-1">
                              {template.items.length}項目
                              {template.items.length > 0 && (
                                <span className="ml-2">
                                  合計: ¥
                                  {template.items
                                    .reduce(
                                      (sum, item) =>
                                        sum + item.price * item.quantity,
                                      0
                                    )
                                    .toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* テンプレート保存ダイアログ */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートを保存</DialogTitle>
            <DialogDescription>
              現在の見積項目をテンプレートとして保存します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>テンプレート名</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="例: ブレーキ点検"
              />
            </div>
            <div>
              <Label>カテゴリー</Label>
              <Select
                value={templateCategory || ""}
                onValueChange={(value) =>
                  setTemplateCategory(value || null)
                }
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="カテゴリーを選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">カテゴリーなし</SelectItem>
                  <SelectItem value="メンテナンス">メンテナンス</SelectItem>
                  <SelectItem value="修理">修理</SelectItem>
                  <SelectItem value="点検">点検</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-base text-slate-700">
              {currentItems.length}項目を保存します
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false);
                setTemplateName("");
                setTemplateCategory(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveTemplateConfirm}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}




