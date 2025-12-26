"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, Bell } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AnnouncementConfig } from "@/lib/announcement-config";
import {
  getStoredAnnouncements,
  saveStoredAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcement-storage";
import { AnnouncementBanner } from "@/components/features/announcement-banner";

/**
 * お知らせ管理ページ
 */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<AnnouncementConfig | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState<Omit<AnnouncementConfig, "id">>({
    message: "",
    backgroundColor: "bg-teal-500",
    textColor: "text-white",
    expiresAt: null,
    priority: 5,
  });

  // お知らせ一覧を読み込み
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = () => {
    const stored = getStoredAnnouncements();
    setAnnouncements(stored);
  };

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      message: "",
      backgroundColor: "bg-teal-500",
      textColor: "text-white",
      expiresAt: null,
      priority: 5,
    });
    setEditingId(null);
  };

  // 追加ダイアログを開く
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // 編集ダイアログを開く
  const handleOpenEditDialog = (announcement: AnnouncementConfig) => {
    setFormData({
      message: announcement.message,
      backgroundColor: announcement.backgroundColor || "bg-teal-500",
      textColor: announcement.textColor || "text-white",
      expiresAt: announcement.expiresAt || null,
      priority: announcement.priority || 0,
    });
    setEditingId(announcement.id);
    setIsEditDialogOpen(true);
  };

  // 削除ダイアログを開く
  const handleOpenDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  // プレビューダイアログを開く
  const handleOpenPreviewDialog = (announcement: AnnouncementConfig) => {
    setPreviewAnnouncement(announcement);
    setIsPreviewDialogOpen(true);
  };

  // お知らせを追加
  const handleAdd = () => {
    if (!formData.message.trim()) {
      toast.error("メッセージを入力してください");
      return;
    }

    const newAnnouncement: AnnouncementConfig = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
    };

    try {
      addAnnouncement(newAnnouncement);
      loadAnnouncements();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("お知らせを追加しました");
    } catch (error) {
      toast.error("お知らせの追加に失敗しました");
    }
  };

  // お知らせを更新
  const handleUpdate = () => {
    if (!editingId || !formData.message.trim()) {
      toast.error("メッセージを入力してください");
      return;
    }

    try {
      updateAnnouncement(editingId, formData);
      loadAnnouncements();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("お知らせを更新しました");
    } catch (error) {
      toast.error("お知らせの更新に失敗しました");
    }
  };

  // お知らせを削除
  const handleDelete = () => {
    if (!deletingId) return;

    try {
      deleteAnnouncement(deletingId);
      loadAnnouncements();
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success("お知らせを削除しました");
    } catch (error) {
      toast.error("お知らせの削除に失敗しました");
    }
  };

  // 有効期限のフォーマット
  const formatExpiresAt = (expiresAt: string | null | undefined): string => {
    if (!expiresAt) return "無期限";
    try {
      const date = new Date(expiresAt);
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "無期限";
    }
  };

  // 有効期限が切れているかチェック
  const isExpired = (expiresAt: string | null | undefined): boolean => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-7xl"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-slate-600 shrink-0" />
            お知らせ管理
          </h1>
        </div>

        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">お知らせ一覧</h2>
            <p className="text-base text-slate-700 mt-1">
              トップページに表示されるお知らせバナーを管理します
            </p>
          </div>
          <Button onClick={handleOpenAddDialog} className="h-12 text-base font-medium">
            <Plus className="h-5 w-5 mr-2 shrink-0" />
            お知らせを追加
          </Button>
        </div>

        {/* お知らせ一覧 */}
        {announcements.length === 0 ? (
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-slate-700 text-base">お知らせが登録されていません</p>
              <Button onClick={handleOpenAddDialog} className="mt-4 h-12 text-base font-medium" variant="outline">
                <Plus className="h-5 w-5 mr-2 shrink-0" />
                最初のお知らせを追加
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const expired = isExpired(announcement.expiresAt);
              return (
                <Card key={announcement.id} className={`border border-slate-300 rounded-xl shadow-md ${expired ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CardTitle className="text-base font-semibold text-slate-900 line-clamp-2">
                            {announcement.message}
                          </CardTitle>
                          {expired && (
                            <Badge variant="destructive" className="text-base font-medium px-2 py-0.5 shrink-0">
                              期限切れ
                            </Badge>
                          )}
                          {announcement.priority && announcement.priority > 0 && (
                            <Badge variant="secondary" className="text-base font-medium px-2 py-0.5 shrink-0">
                              優先度: {announcement.priority}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base text-slate-800 mt-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <span className="font-medium">背景色:</span>{" "}
                              <span className="font-mono text-base">{announcement.backgroundColor || "bg-teal-500"}</span>
                            </div>
                            <div>
                              <span className="font-medium">テキスト色:</span>{" "}
                              <span className="font-mono text-base">{announcement.textColor || "text-white"}</span>
                            </div>
                            <div>
                              <span className="font-medium">有効期限:</span>{" "}
                              <span className="text-base">{formatExpiresAt(announcement.expiresAt)}</span>
                            </div>
                            <div>
                              <span className="font-medium">ID:</span>{" "}
                              <span className="font-mono text-base break-all">{announcement.id}</span>
                            </div>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenPreviewDialog(announcement)}
                        className="h-12 text-base font-medium"
                      >
                        <Eye className="h-4 w-4 mr-1.5 shrink-0" />
                        プレビュー
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenEditDialog(announcement)}
                        className="h-12 text-base font-medium"
                      >
                        <Edit className="h-4 w-4 mr-1.5 shrink-0" />
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleOpenDeleteDialog(announcement.id)}
                        className="h-12 text-base font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 追加ダイアログ */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">お知らせを追加</DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                トップページに表示されるお知らせバナーを追加します
              </DialogDescription>
            </DialogHeader>
            <AnnouncementForm
              formData={formData}
              setFormData={setFormData}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-12 text-base font-medium">
                キャンセル
              </Button>
              <Button onClick={handleAdd} className="h-12 text-base font-medium">追加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">お知らせを編集</DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                お知らせの内容を編集します
              </DialogDescription>
            </DialogHeader>
            <AnnouncementForm
              formData={formData}
              setFormData={setFormData}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-12 text-base font-medium">
                キャンセル
              </Button>
              <Button onClick={handleUpdate} className="h-12 text-base font-medium">更新</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>お知らせを削除</AlertDialogTitle>
              <AlertDialogDescription>
                このお知らせを削除してもよろしいですか？この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* プレビューダイアログ */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">プレビュー</DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                お知らせバナーの表示プレビュー
              </DialogDescription>
            </DialogHeader>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              {previewAnnouncement && (
                <AnnouncementBanner
                  id={previewAnnouncement.id}
                  message={previewAnnouncement.message}
                  backgroundColor={previewAnnouncement.backgroundColor}
                  textColor={previewAnnouncement.textColor}
                  show={true}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="h-12 text-base font-medium">
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

/**
 * お知らせフォームコンポーネント
 */
function AnnouncementForm({
  formData,
  setFormData,
}: {
  formData: Omit<AnnouncementConfig, "id">;
  setFormData: (data: Omit<AnnouncementConfig, "id">) => void;
}) {
  return (
    <div className="space-y-4">
      {/* メッセージ */}
      <div>
        <Label htmlFor="message" className="text-base font-medium text-slate-900">
          メッセージ <span className="text-red-600">*</span>
        </Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="お知らせメッセージを入力（1行で表示されます）"
          className="mt-1.5 min-h-[80px] text-base"
          required
        />
        <p className="text-base text-slate-700 mt-1.5">
          {formData.message.length}文字
        </p>
      </div>

      <Separator />

      {/* 背景色 */}
      <div>
        <Label htmlFor="backgroundColor" className="text-base font-medium text-slate-900">
          背景色
        </Label>
        <Select
          value={formData.backgroundColor || "bg-teal-500"}
          onValueChange={(value) => setFormData({ ...formData, backgroundColor: value })}
        >
          <SelectTrigger className="mt-1.5 h-12 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bg-teal-500">ティール (bg-teal-500)</SelectItem>
            <SelectItem value="bg-blue-500">青 (bg-blue-500)</SelectItem>
            <SelectItem value="bg-green-500">緑 (bg-green-500)</SelectItem>
            <SelectItem value="bg-orange-500">オレンジ (bg-orange-500)</SelectItem>
            <SelectItem value="bg-red-500">赤 (bg-red-500)</SelectItem>
            <SelectItem value="bg-purple-500">紫 (bg-purple-500)</SelectItem>
            <SelectItem value="bg-slate-500">グレー (bg-slate-500)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* テキスト色 */}
      <div>
        <Label htmlFor="textColor" className="text-base font-medium text-slate-900">
          テキスト色
        </Label>
        <Select
          value={formData.textColor || "text-white"}
          onValueChange={(value) => setFormData({ ...formData, textColor: value })}
        >
          <SelectTrigger className="mt-1.5 h-12 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-white">白 (text-white)</SelectItem>
            <SelectItem value="text-slate-900">濃いグレー (text-slate-900)</SelectItem>
            <SelectItem value="text-blue-900">濃い青 (text-blue-900)</SelectItem>
            <SelectItem value="text-black">黒 (text-black)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* 優先度 */}
      <div>
        <Label htmlFor="priority" className="text-base font-medium text-slate-900">
          優先度
        </Label>
        <Input
          id="priority"
          type="number"
          value={formData.priority || 0}
          onChange={(e) =>
            setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
          }
          className="mt-1.5 h-12 text-base"
          min={0}
          max={100}
        />
        <p className="text-base text-slate-700 mt-1.5">
          数値が大きいほど優先度が高くなります（複数表示時の順序）
        </p>
      </div>

      {/* 有効期限 */}
      <div>
        <Label htmlFor="expiresAt" className="text-base font-medium text-slate-900">
          有効期限
        </Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={
            formData.expiresAt
              ? new Date(formData.expiresAt).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          className="mt-1.5 h-12 text-base"
        />
        <p className="text-base text-slate-700 mt-1.5">
          空欄の場合は無期限で表示されます
        </p>
      </div>
    </div>
  );
}




