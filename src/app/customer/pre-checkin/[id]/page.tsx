"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchJobById, fetchVehiclesByCustomerId, updateJobField6, updateJobField10, updateJobField7, fetchCustomerById } from "@/lib/api";
import { ZohoJob, ZohoVehicle, ZohoLookup } from "@/types";
import { Loader2, Car, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";
import useSWR from "swr";

// =============================================================================
// Types
// =============================================================================

interface PreCheckinFormData {
  vehicleId: string | null;
  isNewVehicle: boolean;
  newVehicleName: string;
  newVehicleImage: File | null;
  address: string;
  phone: string;
  emailOptIn: boolean;
  mileage: string;
  issues: string;
  courtesyCarRequested: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function PreCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // ジョブデータの取得
  const { data: jobResponse, isLoading: isJobLoading } = useSWR(
    jobId ? `job-${jobId}` : null,
    () => fetchJobById(jobId),
    { revalidateOnFocus: false }
  );

  const job = jobResponse?.data;
  const customerId = job?.field4?.id;

  // 顧客データの取得
  const { data: customerResponse, isLoading: isCustomerLoading } = useSWR(
    customerId ? `customer-${customerId}` : null,
    () => fetchCustomerById(customerId!),
    { revalidateOnFocus: false }
  );

  const customer = customerResponse?.data;

  // 車両データの取得
  const { data: vehiclesResponse, isLoading: isVehiclesLoading } = useSWR(
    customerId ? `vehicles-${customerId}` : null,
    () => fetchVehiclesByCustomerId(customerId!),
    { revalidateOnFocus: false }
  );

  const vehicles = vehiclesResponse?.data || [];

  // フォームデータ
  const [formData, setFormData] = useState<PreCheckinFormData>({
    vehicleId: null,
    isNewVehicle: false,
    newVehicleName: "",
    newVehicleImage: null,
    address: "",
    phone: "",
    emailOptIn: false,
    mileage: "",
    issues: "",
    courtesyCarRequested: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ジョブデータと顧客データが読み込まれたら、初期値を設定
  useEffect(() => {
    if (job && customer) {
      setFormData((prev) => ({
        ...prev,
        address: customer.mailingStreet || "",
        phone: customer.phone || customer.mobile || "",
        mileage: job.field10?.toString() || "",
      }));
    }
  }, [job, customer]);

  // 画像プレビュー
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, newVehicleImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像削除
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, newVehicleImage: null }));
    setPreviewImage(null);
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. 車両IDの更新（選択された車両がある場合）
      if (formData.vehicleId && !formData.isNewVehicle) {
        await updateJobField6(jobId, formData.vehicleId);
      }

      // 2. メール同意の更新（Email_Opt_Out）
      if (customer) {
        // Email_Opt_Out: true = 同意しない, false = 同意する
        // フォームのemailOptIn: true = 同意する, false = 同意しない
        // したがって、Email_Opt_Out = !emailOptIn となる
        const { updateCustomerWithValidation } = await import("@/lib/customer-update");
        const updateResult = await updateCustomerWithValidation(
          customer.id,
          { Email_Opt_Out: !formData.emailOptIn },
          customer
        );
        
        if (updateResult.success) {
          toast.success(
            formData.emailOptIn 
              ? "メール配信の同意を更新しました" 
              : "メール配信の設定を更新しました"
          );
        } else {
          toast.warning("メール配信設定の更新に失敗しました", {
            description: updateResult.error?.message,
          });
        }
      }

      // 3. 走行距離の更新
      if (formData.mileage) {
        const mileage = parseInt(formData.mileage, 10);
        if (!isNaN(mileage)) {
          await updateJobField10(jobId, mileage);
        }
      }

      // 4. 住所・電話番号の変更を追記（顧客のDescriptionに追記）
      if (customer && (formData.address !== customer.mailingStreet || formData.phone !== (customer.phone || customer.mobile))) {
        const { appendToCustomerDescription } = await import("@/lib/api");
        const { formatChangeRequest } = await import("@/lib/customer-description-append");
        
        const changes: string[] = [];
        if (formData.address !== customer.mailingStreet) {
          changes.push(formatChangeRequest("Mailing_Street", customer.mailingStreet, formData.address));
        }
        if (formData.phone !== (customer.phone || customer.mobile)) {
          const oldPhone = customer.phone || customer.mobile || "";
          changes.push(formatChangeRequest("Phone", oldPhone, formData.phone));
        }
        
        if (changes.length > 0) {
          const changeRequestText = changes.join("\n");
          const result = await appendToCustomerDescription(customer.id, changeRequestText);
          if (result.success) {
            toast.success("住所・電話番号の変更申請を送信しました", {
              description: "事務員が後日確認いたします",
            });
          } else {
            toast.warning("変更申請の送信に失敗しました", {
              description: result.error?.message,
            });
          }
        }
      }

      // 5. 不具合内容の追記（field7に追記）
      if (formData.issues) {
        const currentDetails = job?.field7 || "";
        const newDetails = currentDetails
          ? `${currentDetails}\n【事前入力】不具合・気になるところ: ${formData.issues}`
          : `【事前入力】不具合・気になるところ: ${formData.issues}`;
        await updateJobField7(jobId, newDetails);
      }

      // 6. 代車希望の追記
      if (formData.courtesyCarRequested) {
        const currentDetails = job?.field7 || "";
        const newDetails = currentDetails
          ? `${currentDetails}\n【事前入力】代車希望: あり`
          : `【事前入力】代車希望: あり`;
        await updateJobField7(jobId, newDetails);
      }

      // 7. 新規車両画像のアップロードと車両作成
      if (formData.isNewVehicle && formData.newVehicleImage && customer) {
        const { uploadNewVehicleImage } = await import("@/lib/new-vehicle-image-upload");
        const { createNewVehicleAndLinkImage } = await import("@/lib/new-vehicle-creation");
        
        // まず画像をアップロード
        const uploadResult = await uploadNewVehicleImage(
          formData.newVehicleImage,
          customer.id,
          customer.Last_Name || customer.First_Name || "顧客",
          formData.newVehicleName
        );
        
        if (uploadResult.success && uploadResult.data) {
          // アップロード成功後、新規車両を作成して画像をリンク設定
          const createResult = await createNewVehicleAndLinkImage(
            jobId,
            customer.id,
            customer.Last_Name || customer.First_Name || "顧客",
            formData.newVehicleName,
            null, // 登録番号は事前チェックインでは取得していないためnull
            uploadResult.data.id,
            uploadResult.data.name
          );
          
          if (createResult.success && createResult.data) {
            // 新規車両作成成功
            toast.success("新規車両を作成しました", {
              description: "車検証画像もリンク設定されました",
            });
          } else {
            // 新規車両作成失敗（画像アップロードは成功しているため警告のみ）
            toast.warning("新規車両の作成に失敗しました", {
              description: createResult.error?.message || "画像はアップロード済みです",
            });
          }
        } else {
          // アップロード失敗
          toast.warning("新規車両画像のアップロードに失敗しました", {
            description: uploadResult.error?.message,
          });
        }
      }

      toast.success("事前チェックイン情報を保存しました");
      
      // 3秒後にトップページにリダイレクト
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Pre-checkin submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "保存に失敗しました";
      toast.error("保存に失敗しました", {
        description: errorMessage,
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isJobLoading || isCustomerLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-700 mb-4" />
          <p className="text-slate-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!job || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md border border-slate-300 rounded-xl shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">エラー</h2>
              <p className="text-base text-slate-700">案件情報が見つかりませんでした</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">事前チェックイン</CardTitle>
            <CardDescription className="text-base">
              {job.field4?.name}様のご予約について、事前に入力いただくことで、当日の受付をスムーズに行えます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 車両選択セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-slate-700 shrink-0" />
                  <Label className="text-xl font-bold text-slate-900">今回ご入庫のお車</Label>
                </div>

                {!formData.isNewVehicle ? (
                  <>
                    {isVehiclesLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-700" />
                      </div>
                    ) : vehicles.length > 0 ? (
                      <div className="space-y-2">
                        {vehicles.map((vehicle) => (
                          <label
                            key={vehicle.id}
                            className="flex items-center gap-3 p-4 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="vehicle"
                              value={vehicle.id}
                              checked={formData.vehicleId === vehicle.id}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, vehicleId: e.target.value }))
                              }
                              className="w-5 h-5 text-primary shrink-0"
                            />
                            <div className="flex-1">
                              <p className="text-base font-medium text-slate-900">
                                {vehicle.field44 || "車名未登録"}
                              </p>
                              {vehicle.field44 && vehicle.field44 !== "車名未登録" && (
                                <p className="text-base text-slate-700">
                                  登録番号: {vehicle.field44}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-slate-800 py-2">
                        登録されている車両がありません
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, isNewVehicle: true }))}
                      className="w-full h-12 text-base font-medium"
                    >
                      別の車（新規）
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 p-4 border border-slate-300 rounded-xl bg-slate-50">
                    <div>
                      <Label htmlFor="newVehicleName" className="text-base font-medium">車種名</Label>
                      <Input
                        id="newVehicleName"
                        value={formData.newVehicleName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, newVehicleName: e.target.value }))
                        }
                        placeholder="例: BMW X3"
                        className="mt-1 h-12 text-base"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="newVehicleImage" className="text-base font-medium">車検証の写真</Label>
                      <div className="mt-1">
                        {previewImage ? (
                          <div className="relative aspect-video border border-slate-300 rounded-xl overflow-hidden">
                            <Image
                              src={previewImage}
                              alt="車検証プレビュー"
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 768px"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 h-12 w-12"
                            >
                              <X className="h-5 w-5 shrink-0" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <Upload className="h-8 w-8 text-slate-700 mb-2 shrink-0" />
                            <span className="text-base text-slate-800">画像をアップロード</span>
                            <input
                              type="file"
                              id="newVehicleImage"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isNewVehicle: false,
                          newVehicleName: "",
                          newVehicleImage: null,
                        }))
                      }
                      className="w-full h-12 text-base font-medium"
                    >
                      登録済み車両から選択
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* 顧客情報確認セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-700 shrink-0" />
                  <Label className="text-xl font-bold text-slate-900">お客様情報の確認</Label>
                </div>

                <div>
                  <Label htmlFor="address" className="text-base font-medium">住所</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="mt-1 h-12 text-base"
                  />
                  {customer && formData.address !== customer.mailingStreet && (
                    <Badge variant="outline" className="mt-1 text-base font-medium px-2.5 py-1">
                      変更あり
                    </Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-medium">電話番号</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="mt-1 h-12 text-base"
                  />
                  {customer && formData.phone !== (customer.phone || customer.mobile) && (
                    <Badge variant="outline" className="mt-1 text-base font-medium px-2.5 py-1">
                      変更あり
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* パーミッションセクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-700 shrink-0" />
                  <Label className="text-xl font-bold text-slate-900">メール配信について</Label>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="emailOptIn"
                    checked={formData.emailOptIn}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, emailOptIn: checked as boolean }))
                    }
                    className="h-5 w-5 shrink-0 mt-0.5"
                  />
                  <label
                    htmlFor="emailOptIn"
                    className="text-base text-slate-800 cursor-pointer leading-relaxed"
                  >
                    メールでのお知らせを受け取ることに同意します
                  </label>
                </div>
              </div>

              <Separator />

              {/* 問診セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-700 shrink-0" />
                  <Label className="text-xl font-bold text-slate-900">問診</Label>
                </div>

                <div>
                  <Label htmlFor="mileage" className="text-base font-medium">現在の走行距離（概算）</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mileage: e.target.value }))
                    }
                    placeholder="例: 50000"
                    className="mt-1 h-12 text-base tabular-nums"
                  />
                  <p className="text-base text-slate-700 mt-1">km単位で入力してください</p>
                </div>

                <div>
                  <Label htmlFor="issues" className="text-base font-medium">不具合・気になるところ</Label>
                  <Textarea
                    id="issues"
                    value={formData.issues}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, issues: e.target.value }))
                    }
                    placeholder="例: ブレーキから異音がする、エンジンがかかりにくい"
                    className="mt-1 text-base"
                    rows={4}
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="courtesyCarRequested"
                    checked={formData.courtesyCarRequested}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        courtesyCarRequested: checked as boolean,
                      }))
                    }
                    className="h-5 w-5 shrink-0 mt-0.5"
                  />
                  <label
                    htmlFor="courtesyCarRequested"
                    className="text-base text-slate-800 cursor-pointer leading-relaxed"
                  >
                    代車のご希望があります
                  </label>
                </div>
              </div>

              <Separator />

              {/* 送信ボタン */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" />
                      保存中...
                    </>
                  ) : (
                    "送信"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



