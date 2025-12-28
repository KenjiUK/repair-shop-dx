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
import { toast } from "sonner";
import { fetchJobById, fetchVehiclesByCustomerId, updateJobField6, updateJobField10, updateJobField7, fetchCustomerById } from "@/lib/api";
import { ZohoJob, ZohoVehicle, ZohoLookup } from "@/types";
import { Loader2, Car, CheckCircle2, AlertCircle, Upload, X, FileText, MessageCircle, User } from "lucide-react";
import useSWR from "swr";
import { VehicleRegistrationUpload } from "@/components/features/vehicle-registration-upload";
import { InspectionRecordUpload } from "@/components/features/inspection-record-upload";
import { NewVehicleInspectionRecordUpload } from "@/components/features/new-vehicle-inspection-record-upload";
import { useVehicleMasterById, useCustomerMasterById } from "@/hooks/use-master-data";
import { cn } from "@/lib/utils";
import { searchPostalCode } from "@/lib/postal-code-api";
import { validateFile } from "@/lib/file-validation";
import { submitChangeRequests, createChangeRequestsFromForm } from "@/lib/change-request-api";

// =============================================================================
// Types
// =============================================================================

interface PreCheckinFormData {
  vehicleId: string | null;
  isNewVehicle: boolean;
  newVehicleName: string;
  newVehicleImage: File | null;
  // 車両情報（既存車両選択時）
  vehicleName: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  // 顧客情報
  customerName: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  emailOptIn: boolean;
  mileage: string;
  issues: string;
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
    vehicleName: "",
    vehicleLicensePlate: "",
    vehicleType: "",
    customerName: "",
    postalCode: "",
    address: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    emailOptIn: true,
    mileage: "",
    issues: "",
  });

  // 郵便番号検索中フラグ
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);

  // 選択された車両のマスタ情報を取得
  const selectedZohoVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const { vehicle: vehicleMaster, isLoading: isVehicleMasterLoading } = useVehicleMasterById(
    selectedZohoVehicle?.Name || null
  );

  // 顧客マスタ情報を取得
  const { customer: customerMaster, isLoading: isCustomerMasterLoading } = useCustomerMasterById(
    customer?.ID1 || null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ジョブデータと顧客データが読み込まれたら、初期値を設定
  useEffect(() => {
    if (job && customer) {
      const mailingStreet = customer.mailingStreet || "";
      const addressNumber = customer.addressNumber || customer.field4 || "";
      const buildingName = customer.buildingName || customer.field6 || "";
      
      const fullName = [
        customer.Last_Name || customer.lastName || "",
        customer.First_Name || customer.firstName || "",
      ].filter(Boolean).join(" ");
      
      const fullAddress = [
        mailingStreet,
        addressNumber,
        buildingName,
      ].filter(Boolean).join(" ");
      
      setFormData((prev) => ({
        ...prev,
        customerName: fullName,
        postalCode: "", // 郵便番号はZohoに保存されていない可能性があるため空
        address: fullAddress || "",
        phone: customer.phone || customer.mobile || "",
        email: customer.Email || "",
        dateOfBirth: customer.Date_of_Birth || "",
        emailOptIn: !customer.Email_Opt_Out, // Email_Opt_Out: false = 同意する
        mileage: job.field10?.toString() || "",
      }));
    }
  }, [job, customer]);

  // 車両マスタ情報が読み込まれたら、フォームデータを更新
  useEffect(() => {
    if (vehicleMaster && selectedZohoVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleName: vehicleMaster.車名 || selectedZohoVehicle.field44 || "",
        vehicleLicensePlate: vehicleMaster.登録番号連結 || selectedZohoVehicle.field44 || "",
        vehicleType: vehicleMaster.型式 || "",
      }));
    } else if (selectedZohoVehicle) {
      // マスタ情報がない場合はZohoVehicleの情報を使用
      setFormData((prev) => ({
        ...prev,
        vehicleName: selectedZohoVehicle.field44 || "",
        vehicleLicensePlate: selectedZohoVehicle.field44 || "",
        vehicleType: "",
      }));
    }
  }, [vehicleMaster, selectedZohoVehicle]);

  // 画像プレビュー
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルバリデーション（10MB以下の画像のみ）
      const validation = validateFile(file, ["image"]);
      if (!validation.valid) {
        toast.error(validation.error || "ファイルの形式が不正です");
        e.target.value = "";
        return;
      }
      
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

  // 郵便番号検索
  const handlePostalCodeSearch = async () => {
    const postalCode = formData.postalCode.replace(/\D/g, "");
    if (postalCode.length !== 7) {
      toast.error("郵便番号は7桁で入力してください");
      return;
    }

    setIsSearchingPostalCode(true);
    try {
      const result = await searchPostalCode(postalCode);
      if (result.success && result.data && result.data.length > 0) {
        // 最初の結果を使用
        const firstResult = result.data[0];
        // 住所検索結果を「住所」フィールドに設定（都道府県+市区町村+町域）
        const fullAddress = [
          firstResult.prefecture,
          firstResult.city,
          firstResult.town,
        ].filter(Boolean).join("");
        setFormData((prev) => ({
          ...prev,
          address: fullAddress,
        }));
        toast.success("住所を取得しました");
      } else {
        toast.error(result.error?.message || "郵便番号が見つかりませんでした");
      }
    } catch (error) {
      console.error("郵便番号検索エラー:", error);
      toast.error("郵便番号検索中にエラーが発生しました");
    } finally {
      setIsSearchingPostalCode(false);
    }
  };

  // 送信内容の確認項目を生成
  const getConfirmItems = (): string[] => {
    const items: string[] = [];
    
    // 新規車両の場合
    if (formData.isNewVehicle) {
      if (formData.newVehicleName) {
        items.push(`新規車両: ${formData.newVehicleName}`);
      }
      if (formData.newVehicleImage) {
        items.push(`車検証写真: アップロード予定`);
      }
    } else if (formData.vehicleId) {
      // 既存車両選択
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (selectedVehicle) {
        items.push(`選択車両: ${selectedVehicle.field44 || "車名未登録"}`);
      }
    }
    
    // 走行距離
    if (formData.mileage) {
      items.push(`走行距離: ${formData.mileage}km`);
    }
    
    // 不具合・気になるところ
    if (formData.issues) {
      items.push(`不具合・気になるところ: ${formData.issues}`);
    }
    
    // 誕生日の変更（変更がある場合のみ）
    if (customer && formData.dateOfBirth) {
      const oldDateOfBirth = customer.Date_of_Birth || "";
      if (formData.dateOfBirth !== oldDateOfBirth) {
        if (oldDateOfBirth) {
          items.push(`誕生日の変更: ${oldDateOfBirth} → ${formData.dateOfBirth}`);
        } else {
          items.push(`誕生日: ${formData.dateOfBirth}`);
        }
      }
    }
    
    // 顧客名の変更
    if (customer) {
      const oldFullName = [
        customer.Last_Name || customer.lastName || "",
        customer.First_Name || customer.firstName || "",
      ].filter(Boolean).join(" ");
      if (formData.customerName && formData.customerName !== oldFullName) {
        items.push(`氏名の変更申請: ${oldFullName || "未登録"} → ${formData.customerName}`);
      }
    }
    
    // 住所の変更
    if (customer) {
      const newAddress = formData.address.trim();
      const oldAddress = [
        customer.mailingStreet || customer.Mailing_Street,
        customer.addressNumber || customer.field4,
        customer.buildingName || customer.field6,
      ].filter(Boolean).join(" ").trim();
      
      if (newAddress && newAddress !== oldAddress) {
        items.push(`住所の変更申請: ${oldAddress || "未登録"} → ${newAddress}`);
      }
    }
    
    // 電話番号の変更
    if (customer) {
      const oldPhone = customer.phone || customer.mobile || customer.Phone || customer.Mobile || "";
      if (formData.phone && formData.phone !== oldPhone) {
        items.push(`電話番号の変更申請: ${oldPhone || "未登録"} → ${formData.phone}`);
      }
    }
    
    // メールアドレスの変更
    if (customer) {
      const oldEmail = customer.Email || "";
      if (formData.email && formData.email !== oldEmail) {
        items.push(`メールアドレスの変更申請: ${oldEmail || "未登録"} → ${formData.email}`);
      }
    }
    
    // 車両情報の変更（既存車両選択時）
    if (!formData.isNewVehicle && vehicleMaster) {
      const vehicleChanges: string[] = [];
      if (formData.vehicleName && vehicleMaster.車名 && formData.vehicleName !== vehicleMaster.車名) {
        vehicleChanges.push(`車名: ${vehicleMaster.車名} → ${formData.vehicleName}`);
      }
      if (formData.vehicleLicensePlate && vehicleMaster.登録番号連結 && formData.vehicleLicensePlate !== vehicleMaster.登録番号連結) {
        vehicleChanges.push(`登録番号: ${vehicleMaster.登録番号連結} → ${formData.vehicleLicensePlate}`);
      }
      if (formData.vehicleType && vehicleMaster.型式 && formData.vehicleType !== vehicleMaster.型式) {
        vehicleChanges.push(`型式: ${vehicleMaster.型式} → ${formData.vehicleType}`);
      }
      if (vehicleChanges.length > 0) {
        items.push(`車両情報の変更申請:\n  ${vehicleChanges.join("\n  ")}`);
      }
    }
    
    // メール配信の同意
    if (customer) {
      const oldOptIn = !customer.Email_Opt_Out;
      if (formData.emailOptIn !== oldOptIn) {
        items.push(`メール配信: ${oldOptIn ? "同意" : "拒否"} → ${formData.emailOptIn ? "同意" : "拒否"}`);
      }
    }
    
    return items;
  };

  // フォーム送信（確認ダイアログ表示）
  const handleSubmit = () => {
    // バリデーション
    if (!formData.dateOfBirth) {
      toast.error("誕生日は必須項目です");
      return;
    }
    
    // 確認ダイアログを表示
    setShowConfirmDialog(true);
  };

  // 実際の送信処理
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      // 1. 車両IDの更新（選択された車両がある場合）
      if (formData.vehicleId && !formData.isNewVehicle) {
        await updateJobField6(jobId, formData.vehicleId);

        // 車両情報の変更申請をスプレッドシートに記録（マスタデータと異なる場合）
        if (customer && customerMaster && vehicleMaster) {
          const smartCarDealerCustomerId = customerMaster.顧客ID || customer.ID1 || customer.id;
          const customerName = customerMaster.顧客名 || customer.Last_Name || "";
          const smartCarDealerVehicleId = vehicleMaster.車両ID || formData.vehicleId;
          
          const vehicleChangeRequests: Array<{
            fieldName: string;
            oldValue: string | null | undefined;
            newValue: string | null | undefined;
            masterType?: "customer" | "vehicle";
            vehicleId?: string;
          }> = [];
          
          if (formData.vehicleName && vehicleMaster.車名 && formData.vehicleName !== vehicleMaster.車名) {
            vehicleChangeRequests.push({
              fieldName: "vehicleName",
              oldValue: vehicleMaster.車名,
              newValue: formData.vehicleName,
              masterType: "vehicle",
              vehicleId: smartCarDealerVehicleId,
            });
          }
          if (formData.vehicleLicensePlate && vehicleMaster.登録番号連結 && formData.vehicleLicensePlate !== vehicleMaster.登録番号連結) {
            vehicleChangeRequests.push({
              fieldName: "licensePlate",
              oldValue: vehicleMaster.登録番号連結,
              newValue: formData.vehicleLicensePlate,
              masterType: "vehicle",
              vehicleId: smartCarDealerVehicleId,
            });
          }
          if (formData.vehicleType && vehicleMaster.型式 && formData.vehicleType !== vehicleMaster.型式) {
            vehicleChangeRequests.push({
              fieldName: "vehicleType",
              oldValue: vehicleMaster.型式,
              newValue: formData.vehicleType,
              masterType: "vehicle",
              vehicleId: smartCarDealerVehicleId,
            });
          }

          if (vehicleChangeRequests.length > 0) {
            const changeRequests = createChangeRequestsFromForm({
              customerId: smartCarDealerCustomerId,
              customerName,
              jobId,
              source: "事前チェックイン",
              changes: vehicleChangeRequests,
            });
            
            const result = await submitChangeRequests(changeRequests);
            if (result.success) {
              toast.info("車両情報の変更申請を記録しました", {
                description: "事務員が後日確認いたします",
              });
            }
          }
        }
      }

      // 2. 顧客情報の更新（メール同意、誕生日は直接更新可能）
      if (customer) {
        const { updateCustomerWithValidation } = await import("@/lib/customer-update");
        const updateData: Partial<typeof customer> = {};
        
        // メール同意の更新（Email_Opt_Out）
        // Email_Opt_Out: true = 同意しない, false = 同意する
        // フォームのemailOptIn: true = 同意する, false = 同意しない
        // したがって、Email_Opt_Out = !emailOptIn となる
        updateData.Email_Opt_Out = !formData.emailOptIn;
        
        // 誕生日の更新（必須項目、バリデーションは既に実行済み）
        if (formData.dateOfBirth && formData.dateOfBirth !== customer.Date_of_Birth) {
          updateData.Date_of_Birth = formData.dateOfBirth;
        }
        
        // 更新を実行（直接更新可能なフィールドのみ）
        if (Object.keys(updateData).length > 0) {
          const updateResult = await updateCustomerWithValidation(
            customer.id,
            updateData,
            customer
          );
          
          if (updateResult.success) {
            toast.success("顧客情報を更新しました");
          } else {
            toast.warning("顧客情報の更新に失敗しました", {
              description: updateResult.error?.message,
            });
          }
        }
      }

      // 3. 走行距離の更新
      if (formData.mileage) {
        const mileage = parseInt(formData.mileage, 10);
        if (!isNaN(mileage)) {
          await updateJobField10(jobId, mileage);
        }
      }

      // 4. 顧客情報の変更申請をスプレッドシートに記録
      if (customer && customerMaster) {
        // 顧客IDをスマートカーディーラーのIDに変換（顧客マスタから取得）
        const smartCarDealerCustomerId = customerMaster.顧客ID || customer.ID1 || customer.id;
        const customerName = customerMaster.顧客名 || customer.Last_Name || "";
        
        // 住所の変更チェック
        const newAddress = formData.address.trim();
        const oldAddress = customerMaster.住所連結 || [
          customer.mailingStreet || customer.Mailing_Street,
          customer.addressNumber || customer.field4,
          customer.buildingName || customer.field6,
        ].filter(Boolean).join(" ").trim();
        
        // 電話番号の変更チェック
        const oldPhone = customerMaster.電話番号 || customer.phone || customer.Phone || "";
        const oldMobile = customerMaster.携帯番号 || customer.mobile || customer.Mobile || "";
        
        // 顧客名の変更チェック
        const oldFullName = customerMaster.顧客名 || [
          customer.Last_Name || "",
          customer.First_Name || "",
        ].filter(Boolean).join(" ");
        
        // 変更申請データを作成
        const changeRequestChanges: Array<{
          fieldName: string;
          oldValue: string | null | undefined;
          newValue: string | null | undefined;
          masterType?: "customer" | "vehicle";
        }> = [];
        
        // 住所変更
        if (newAddress && newAddress !== oldAddress) {
          changeRequestChanges.push({
            fieldName: "address",
            oldValue: oldAddress || null,
            newValue: newAddress,
            masterType: "customer",
          });
        }
        
        // 電話番号変更（携帯番号として記録）
        if (formData.phone && formData.phone !== oldPhone && formData.phone !== oldMobile) {
          changeRequestChanges.push({
            fieldName: "Mobile",
            oldValue: oldMobile || oldPhone || null,
            newValue: formData.phone,
            masterType: "customer",
          });
        }
        
        // 顧客名変更
        if (formData.customerName && formData.customerName !== oldFullName) {
          changeRequestChanges.push({
            fieldName: "customerName",
            oldValue: oldFullName || null,
            newValue: formData.customerName,
            masterType: "customer",
          });
        }
        
        // メールアドレス変更
        if (formData.email && formData.email !== customer.Email) {
          changeRequestChanges.push({
            fieldName: "Email",
            oldValue: customer.Email || null,
            newValue: formData.email,
            masterType: "customer",
          });
        }
        
        // スプレッドシートに記録
        if (changeRequestChanges.length > 0) {
          const changeRequests = createChangeRequestsFromForm({
            customerId: smartCarDealerCustomerId,
            customerName,
            jobId,
            source: "事前チェックイン",
            changes: changeRequestChanges,
          });
          
          const result = await submitChangeRequests(changeRequests);
          if (result.success) {
            toast.success("顧客情報の変更申請を記録しました", {
              description: `${result.addedCount}件の変更申請を送信しました。事務員が後日対応いたします。`,
            });
          } else {
            toast.warning("変更申請の記録に失敗しました", {
              description: result.error,
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

      // 6. 新規車両画像のアップロードと車両作成
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

      toast.success("事前チェックイン情報を送信しました。ありがとうございます。");
      
      // 5秒後にトップページにリダイレクト
      setTimeout(() => {
        router.push("/");
      }, 5000);
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
      <div className="max-w-4xl mx-auto">
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">事前チェックイン</CardTitle>
            <CardDescription className="text-base">
              {job.field4?.name}様のご予約について、事前に入力いただくことで、当日の受付をスムーズに行えます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 車両選択セクション */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-slate-700 shrink-0" />
                    <Label className="text-xl font-bold text-slate-900">今回ご入庫のお車</Label>
                  </div>
                  <p className="text-base text-slate-700">もし違う場合は修正や登録をお願いします</p>
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
                              {vehicle.field44 && vehicle.licensePlate && vehicle.field44 !== vehicle.licensePlate && (
                                <p className="text-base text-slate-700">
                                  登録番号: {vehicle.licensePlate}
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

                    {/* 書類アップロードセクション（新規車両） */}
                    {formData.newVehicleName && customer && (
                      <div className="space-y-4 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-slate-700 shrink-0" />
                          <Label className="text-lg font-bold text-slate-900">書類のアップロード</Label>
                        </div>
                        <p className="text-base text-slate-700">
                          まだ提出されていない場合は、以下からアップロードをお願いします
                        </p>

                        {/* 車検証 */}
                        <div>
                          <Label className="text-base font-medium mb-2 block">車検証</Label>
                          <p className="text-base text-slate-600 mb-2">
                            電子車検証（ICカードタイプ）または従来の紙の車検証をアップロードできます
                          </p>
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
                            <div className="space-y-2">
                              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <Upload className="h-6 w-6 text-slate-700 mb-1 shrink-0" />
                                <span className="text-base text-slate-800">ファイルを選択</span>
                                <input
                                  type="file"
                                  id="newVehicleImage"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-base text-slate-600">
                                対応形式: 画像（JPG, PNG, WebP）/ 最大サイズ: 10MB
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 自動車検査証記録事項 */}
                        <div>
                          <Label className="text-base font-medium mb-2 block">自動車検査証記録事項</Label>
                          <p className="text-base text-slate-600 mb-2">
                            電子車検証（ICタグ付き）をお持ちの場合、氏名・住所などが記載された「自動車検査証記録事項」もアップロードできます
                          </p>
                          <NewVehicleInspectionRecordUpload
                            customerId={customer.id}
                            customerName={customer.Last_Name || customer.First_Name || "顧客"}
                            vehicleName={formData.newVehicleName}
                          />
                        </div>

                        {/* 走行距離 */}
                        <div>
                          <Label htmlFor="newVehicleMileage" className="text-base font-medium">現在の走行距離</Label>
                          <Input
                            id="newVehicleMileage"
                            type="number"
                            value={formData.mileage}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, mileage: e.target.value }))
                            }
                            placeholder="50000"
                            className="mt-1 h-12 text-base tabular-nums"
                          />
                          <p className="text-base text-slate-700 mt-1">km / miで入力してください</p>
                        </div>
                      </div>
                    )}

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

              {/* 車両情報確認セクション（既存車両選択時） */}
              {!formData.isNewVehicle && formData.vehicleId && customer && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-slate-700 shrink-0" />
                        <Label className="text-xl font-bold text-slate-900">車両情報の確認</Label>
                      </div>
                      <p className="text-base text-slate-700">もし違う場合は修正や登録をお願いします</p>
                    </div>

                    <div className="space-y-4 p-4 border border-slate-300 rounded-xl bg-slate-50">
                      <div>
                        <Label htmlFor="vehicleName" className="text-base font-medium">車名</Label>
                        <Input
                          id="vehicleName"
                          value={formData.vehicleName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, vehicleName: e.target.value }))
                          }
                          className="mt-1 h-12 text-base"
                          placeholder="例: BMW X3"
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleLicensePlate" className="text-base font-medium">登録番号</Label>
                        <Input
                          id="vehicleLicensePlate"
                          value={formData.vehicleLicensePlate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, vehicleLicensePlate: e.target.value }))
                          }
                          className="mt-1 h-12 text-base"
                          placeholder="例: 品川 500 さ 1234"
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleType" className="text-base font-medium">型式</Label>
                        <Input
                          id="vehicleType"
                          value={formData.vehicleType}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, vehicleType: e.target.value }))
                          }
                          className="mt-1 h-12 text-base"
                          placeholder="例: F25"
                        />
                      </div>

                      {/* 走行距離 */}
                      <div>
                        <Label htmlFor="mileage" className="text-base font-medium">現在の走行距離</Label>
                        <Input
                          id="mileage"
                          type="number"
                          value={formData.mileage}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, mileage: e.target.value }))
                          }
                          placeholder="50000"
                          className="mt-1 h-12 text-base tabular-nums"
                        />
                        <p className="text-base text-slate-700 mt-1">km / miで入力してください</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 車検証アップロードセクション（既存車両選択時） */}
              {!formData.isNewVehicle && formData.vehicleId && customer && (() => {
                const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
                if (!selectedVehicle) return null;
                
                return (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* 車検有効期限の表示 */}
                      {selectedVehicle.field7 && (() => {
                        const expiryDate = new Date(selectedVehicle.field7);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntilExpiry < 0) {
                          return (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                              <p className="text-base text-red-700 font-medium">
                                ⚠️ 車検が期限切れです。早急に更新をお願いします。
                              </p>
                              <p className="text-base text-red-600 mt-1">
                                車検有効期限: {expiryDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          );
                        } else if (daysUntilExpiry <= 90) {
                          return (
                            <div className={`p-4 border rounded-xl ${daysUntilExpiry <= 30 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                              <p className={`text-base font-medium ${daysUntilExpiry <= 30 ? "text-amber-900" : "text-blue-800"}`}>
                                {daysUntilExpiry <= 30 && "⚠️ "}車検有効期限まであと<span className="tabular-nums">{daysUntilExpiry}</span>日です。
                                {daysUntilExpiry <= 30 && "更新をご検討ください。"}
                              </p>
                              <p className={`text-base mt-1 ${daysUntilExpiry <= 30 ? "text-amber-800" : "text-blue-700"}`}>
                                車検有効期限: {expiryDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-base text-slate-700">
                              車検有効期限: <span className="font-medium">{expiryDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</span>（あと<span className="tabular-nums">{daysUntilExpiry}</span>日）
                            </p>
                          </div>
                        );
                      })()}
                      
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-700 shrink-0" />
                        <Label className="text-xl font-bold text-slate-900">書類のアップロード</Label>
                      </div>
                      <p className="text-base text-slate-700">
                        まだ提出されていない場合は、以下からアップロードをお願いします
                      </p>

                      {/* 車検証 */}
                      <div>
                        <Label className="text-base font-medium mb-2 block">車検証</Label>
                        <p className="text-base text-slate-600 mb-2">
                          電子車検証（ICカードタイプ）または従来の紙の車検証をアップロードできます
                        </p>
                        <VehicleRegistrationUpload
                          customerId={customer.id}
                          customerName={customer.Last_Name || customer.First_Name || "顧客"}
                          vehicleId={selectedVehicle.id}
                          vehicleName={selectedVehicle.field44 || "車名未登録"}
                        />
                      </div>
                      
                      {/* 自動車検査証記録事項 */}
                      <div className="mt-4">
                        <Label className="text-base font-medium mb-2 block">自動車検査証記録事項</Label>
                        <p className="text-base text-slate-600 mb-2">
                          電子車検証（ICタグ付き）をお持ちの場合、氏名・住所などが記載された「自動車検査証記録事項」もアップロードできます
                        </p>
                        <InspectionRecordUpload
                          customerId={customer.id}
                          customerName={customer.Last_Name || customer.First_Name || "顧客"}
                          vehicleId={selectedVehicle.id}
                          vehicleName={selectedVehicle.field44 || "車名未登録"}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}

              <Separator />

              {/* ご要望・お聞かせくださいセクション */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-slate-700 shrink-0" />
                    <Label className="text-xl font-bold text-slate-900">ご要望・お聞かせください</Label>
                  </div>
                  <p className="text-base text-slate-700">お車の不具合やご要望があればお聞かせください</p>
                </div>

                <div className="space-y-4">
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
                </div>
              </div>

              <Separator />

              {/* 顧客情報確認セクション */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-700 shrink-0" />
                    <Label className="text-xl font-bold text-slate-900">お客様情報の確認</Label>
                  </div>
                  <p className="text-base text-slate-700">もし違う場合は修正や登録をお願いします</p>
                </div>

                <div className="space-y-4">
                  {/* 顧客名 */}
                  <div>
                    <Label htmlFor="customerName" className="text-base font-medium">お名前</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                      }
                      className="mt-1 h-12 text-base"
                      placeholder="田中 太郎"
                    />
                  </div>

                  {/* 郵便番号 */}
                  <div>
                    <Label htmlFor="postalCode" className="text-base font-medium">郵便番号</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="postalCode"
                        type="text"
                        inputMode="numeric"
                        value={formData.postalCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 7);
                          setFormData((prev) => ({ ...prev, postalCode: value }));
                        }}
                        className="h-12 text-base w-32 tabular-nums"
                        placeholder="1234567"
                        maxLength={7}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePostalCodeSearch}
                        disabled={isSearchingPostalCode || formData.postalCode.length !== 7}
                        className="h-12 text-base font-medium"
                      >
                        {isSearchingPostalCode ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" />
                            検索中
                          </>
                        ) : (
                          "住所検索"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 住所 */}
                  <div>
                    <Label htmlFor="address" className="text-base font-medium">住所</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="mt-1 h-12 text-base"
                      placeholder="東京都品川区東品川2-3-5"
                    />
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
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-medium">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="mt-1 h-12 text-base"
                      placeholder="example@email.com"
                    />
                    {customer && formData.email && customer.Email && formData.email !== customer.Email && (
                      <Badge variant="outline" className="mt-1 text-base font-medium px-2.5 py-1">
                        変更あり
                      </Badge>
                    )}
                    <div className="flex items-start gap-2 mt-2">
                      <Checkbox
                        id="emailOptIn"
                        checked={true}
                        disabled={true}
                        className="h-5 w-5 shrink-0 mt-0.5"
                      />
                      <label
                        htmlFor="emailOptIn"
                        className="text-base text-slate-800 leading-relaxed"
                      >
                        車検日などの重要な案内をメールでお送りします。上記のメールアドレス宛にお送りします。
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth" className="text-base font-medium">誕生日</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                      }
                      className="mt-1 h-12 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 送信ボタン */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" />
                      保存中...
                    </>
                  ) : (
                    "確認して送信"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 送信確認ダイアログ */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">
                送信内容の確認
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-700">
                以下の内容で送信しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="space-y-3">
                {getConfirmItems().map((item, index) => (
                  <div key={index} className="text-base text-slate-800 whitespace-pre-line">
                    ○ {item}
                  </div>
                ))}
                {getConfirmItems().length === 0 && (
                  <div className="text-base text-slate-600">
                    変更内容はありません
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-12 text-base font-medium">
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="h-12 text-base font-medium"
              >
                送信する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}



