import React, { useCallback, useState, useEffect, useRef } from "react";
import axios from "axios";
import { Camera, Check, LoaderCircle } from "lucide-react";
import userService from "@/services/user.service";
import storageService from "@/services/storage.service";
import AddressEditor from "@/components/settings/AddressEditor";
import AvatarCropModal from "@/components/avatar/AvatarCropModal";
import UserAvatar from "@/components/common/UserAvatar";
import { MediaLightboxModal, type MediaGalleryItem } from "@/components/common/MediaGallery";
import { fetchCurrentUser } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { UpdateUserProfileRequest, UserProfile } from "@/types/user.type";
import { toast } from "sonner";

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB

export default function ProfileSection() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);
  const userId = useAppSelector((state) => state.auth.userId);
  const status = useAppSelector((state) => state.user.status);
  const loadError = useAppSelector((state) => state.user.error);

  if (status === "loading" && !profile) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-primary" />
        Đang tải thông tin cá nhân...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
        {loadError || "Không có dữ liệu người dùng."}
      </div>
    );
  }

  return <ProfileContent key={profile.updatedAt ?? profile.id} profile={profile} userId={userId} dispatch={dispatch} />;
}

function ProfileContent({
  profile,
  userId,
  dispatch,
}: {
  profile: UserProfile;
  userId: string | null;
  dispatch: ReturnType<typeof useAppDispatch>;
}) {
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [username, setUsername] = useState(profile.username || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [dob, setDob] = useState(profile.dob || "");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "OTHER" | "">(
    (profile.gender as "FEMALE" | "MALE" | "OTHER") || "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSource, setAvatarSource] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [avatarMediaItems, setAvatarMediaItems] = useState<MediaGalleryItem[]>([]);
  const [avatarInitialIndex, setAvatarInitialIndex] = useState(0);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || profile.username || "Người dùng";

  const buildFallbackAvatarItem = useCallback((): MediaGalleryItem => {
    const initial = (fullName.charAt(0) || "U").toUpperCase();
    const defaultSvgAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#2563EB"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="160" font-weight="bold" fill="#FFFFFF">${initial}</text></svg>`
    )}`;

    return {
      id: profile.avatarStorageId ?? "admin-avatar-current",
      type: "image",
      url: profile.avatarUrl || defaultSvgAvatar,
      alt: `Ảnh đại diện - ${fullName}`,
    };
  }, [fullName, profile.avatarStorageId, profile.avatarUrl]);

  const openAvatarGallery = useCallback(async () => {
    if (loadingAvatars) return;

    setLoadingAvatars(true);
    try {
      const objects = await storageService.listUserAvatars(profile.id);
      if (objects.length === 0) {
        setAvatarMediaItems([buildFallbackAvatarItem()]);
        setAvatarInitialIndex(0);
        setAvatarViewerOpen(true);
        return;
      }

      const items = await Promise.all(
        objects.map(async (object) => ({
          id: object.id,
          type: "image" as const,
          url: await storageService.getViewUrl(object.id),
          alt:
            object.id === profile.avatarStorageId
              ? `Ảnh đại diện hiện tại - ${fullName}`
              : `Ảnh đại diện - ${fullName}`,
        })),
      );

      const currentIndex = objects.findIndex((object) => object.id === profile.avatarStorageId);
      setAvatarMediaItems(items);
      setAvatarInitialIndex(currentIndex >= 0 ? currentIndex : 0);
      setAvatarViewerOpen(true);
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : requestError instanceof Error
          ? requestError.message
          : "Không thể tải lịch sử ảnh đại diện.";
      toast.error(message);
    } finally {
      setLoadingAvatars(false);
    }
  }, [buildFallbackAvatarItem, fullName, loadingAvatars, profile.avatarStorageId, profile.id]);

  useEffect(() => {
    return () => {
      if (avatarSource) URL.revokeObjectURL(avatarSource.url);
    };
  }, [avatarSource]);

  const isDirty =
    firstName !== (profile.firstName || "") ||
    lastName !== (profile.lastName || "") ||
    phone !== (profile.phone || "") ||
    email !== (profile.email || "") ||
    dob !== (profile.dob || "") ||
    gender !== ((profile.gender as "FEMALE" | "MALE" | "OTHER") || "");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const request: UpdateUserProfileRequest = {
        username: profile.username,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        dob: dob || null,
        gender: (gender as "FEMALE" | "MALE" | "OTHER") || null,
      };

      await userService.updateProfile(request);
      if (userId) {
        await dispatch(fetchCurrentUser({ userId, force: true })).unwrap();
      }
      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật thông tin cá nhân.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadingAvatar) return;

    if (!AVATAR_TYPES.has(file.type)) {
      toast.error("Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_SIZE) {
      toast.error("Ảnh gốc không được vượt quá 20 MB.");
      return;
    }

    setAvatarSource({
      url: URL.createObjectURL(file),
      fileName: file.name,
    });
  };

  const handleCroppedAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const targetUserId = userId || profile.id;
      const storageId = await storageService.uploadUserAvatar(file, targetUserId);
      await userService.updateAvatar({ storageId });
      await dispatch(fetchCurrentUser({ userId: targetUserId, force: true })).unwrap();
      toast.success("Cập nhật ảnh đại diện thành công!");
      setAvatarSource(null);
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message
        : requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật ảnh đại diện.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const closeAvatarCrop = () => {
    if (uploadingAvatar) return;
    setAvatarSource(null);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      {avatarSource && (
        <AvatarCropModal
          imageUrl={avatarSource.url}
          originalFileName={avatarSource.fileName}
          onCancel={closeAvatarCrop}
          onConfirm={handleCroppedAvatar}
        />
      )}

      {/* Fullscreen Avatar Lightbox Viewer */}
      <MediaLightboxModal
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        mediaItems={avatarMediaItems}
        initialIndex={avatarInitialIndex}
        title={`Ảnh đại diện - ${fullName}`}
        alwaysShowThumbnails={true}
      />

      {/* 1. Header Profile Box */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
        <div className="relative group">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarSelected}
          />
          <div
            onClick={openAvatarGallery}
            className="cursor-pointer rounded-full transition-transform duration-200 group-hover:scale-105 active:scale-95"
            title="Nhấn để xem ảnh đại diện"
          >
            <UserAvatar
              src={profile?.avatarUrl}
              name={fullName}
              sizeClassName="h-16 w-16 sm:h-18 sm:w-18 text-2xl"
            />
            {loadingAvatars && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <LoaderCircle className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              avatarInputRef.current?.click();
            }}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-card border border-border text-foreground hover:text-primary shadow-xs transition-colors cursor-pointer"
            title="Thay đổi ảnh đại diện"
          >
            {uploadingAvatar ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="font-bold text-base text-foreground">{fullName}</h3>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* 2. Profile Edit Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-4 shadow-2xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <TextField
            label="Tên"
            value={firstName}
            onChange={setFirstName}
          />
          <TextField
            label="Họ"
            value={lastName}
            onChange={setLastName}
          />
          <TextField
            label="Tên đăng nhập"
            value={username}
            onChange={setUsername}
          />
          <TextField
            label="Số điện thoại"
            value={phone}
            onChange={setPhone}
            inputMode="tel"
          />
          <TextField
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
          />
          <TextField
            label="Ngày sinh"
            value={dob}
            onChange={setDob}
            type="date"
            max={getLatestAdultBirthDate()}
          />

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-[11px] font-semibold text-foreground">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender((e.target.value || "") as "FEMALE" | "MALE" | "OTHER" | "")}
              className="w-full h-10 px-3.5 bg-muted/50 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all cursor-pointer"
            >
              <option value="">Chưa cập nhật</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isSubmitting ? "Đang cập nhật..." : "Cập nhật thông tin"}</span>
          </button>
        </div>
      </form>

      <AddressEditor
        initialAddress={profile.address}
        onSaved={async () => {
          await dispatch(fetchCurrentUser({ userId: userId ?? profile.id, force: true })).unwrap();
        }}
      />

      {/* 3. System Info Cards Grid */}
      <section className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-4 shadow-2xs">
        <div>
          <h4 className="text-sm font-bold text-foreground">Thông tin hệ thống</h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Dữ liệu chỉ đọc được đồng bộ từ tài khoản backend.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="USER ID" value={profile.id} mono />
          <ReadOnlyField label="ROLE ID" value={profile.roleId || "Chưa được gán"} mono />
          <ReadOnlyField label="VAI TRÒ" value={formatRole(profile.role)} />
          <ReadOnlyField
            label="ONBOARDING"
            value={profile.onBoarded ? "Đã hoàn thành" : "Chưa hoàn thành"}
          />
          <ReadOnlyField
            label="TRẠNG THÁI TÀI KHOẢN"
            value={profile.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}
          />
          <ReadOnlyField label="NGÀY TẠO" value={formatInstant(profile.createdAt)} />
          <ReadOnlyField label="CẬP NHẬT GẦN NHẤT" value={formatInstant(profile.updatedAt)} />
        </div>
      </section>
    </div>
  );
}

function formatInstant(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date);
}

function getLatestAdultBirthDate() {
  const today = new Date();
  const year = today.getFullYear() - 18;
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRole(role?: string | null) {
  if (role === "USER") return "Người dùng";
  if (role === "ADMIN") return "Quản trị viên";
  return role || "Chưa được gán";
}

function ReadOnlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 break-all text-xs text-foreground ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  max?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-foreground">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`w-full h-10 px-3.5 bg-muted/50 focus:bg-background rounded-xl border text-xs sm:text-sm text-foreground outline-none transition-all ${error ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
          }`}
      />
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}
