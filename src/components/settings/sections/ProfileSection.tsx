import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, LoaderCircle } from "lucide-react";
import userService from "@/services/user.service";
import { fetchCurrentUser } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { UpdateUserProfileRequest } from "@/types/user.type";
import { toast } from "sonner";

export default function ProfileSection() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);
  const userId = useAppSelector((state) => state.auth.userId);
  const status = useAppSelector((state) => state.user.status);

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [gender, setGender] = useState<"FEMALE" | "MALE" | "OTHER" | "">(
    (profile?.gender as "FEMALE" | "MALE" | "OTHER") || "MALE",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setDob(profile.dob || "");
      setGender((profile.gender as "FEMALE" | "MALE" | "OTHER") || "MALE");
    }
  }, [profile]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || profile?.username || "Admin";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

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
      toast.success("Cập nhật thông tin quản trị thành công!");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : err instanceof Error
        ? err.message
        : "Không thể cập nhật hồ sơ.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" && !profile) {
    return (
      <div className="flex min-h-72 items-center justify-center text-xs sm:text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-primary" />
        Đang tải thông tin cá nhân...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      {/* 1. Header Profile Banner Card */}
      <div className="bg-card rounded-3xl border border-border p-5 flex items-center gap-4 shadow-2xs">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-card overflow-hidden">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-verified border-2 border-card rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">{fullName}</h3>
          <p className="text-xs text-muted-foreground truncate">{profile?.email || "admin@homespace.vn"}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
            {profile?.role || "Quản trị viên"}
          </span>
        </div>
      </div>

      {/* 2. Profile Details Form */}
      <form onSubmit={handleSave} className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Tên
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nhập tên"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>

          {/* Họ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Họ
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nhập họ"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên đăng nhập (Read-only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={profile?.username || ""}
              disabled
              className="w-full h-10 px-3.5 bg-muted/70 rounded-xl border border-border text-xs sm:text-sm text-muted-foreground outline-none cursor-not-allowed"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0353999798"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email liên hệ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Email liên hệ
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@homespace.vn"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>

          {/* Ngày sinh */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Ngày sinh
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>
        </div>

        {/* Giới tính */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground">
            Giới tính
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "FEMALE" | "MALE" | "OTHER")}
            className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all cursor-pointer"
          >
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Cập nhật thông tin</span>
          </button>
        </div>
      </form>

      {/* 3. System Info Section */}
      <div className="bg-card rounded-3xl border border-border p-6 space-y-3 shadow-2xs">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Thông tin hệ thống
        </h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span>Mã định danh User ID:</span>
            <span className="font-mono text-foreground font-semibold">{profile?.id || userId || "N/A"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span>Vai trò quản trị:</span>
            <span className="text-primary font-bold">{profile?.role || "Quản trị viên"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Trạng thái tài khoản:</span>
            <span className="text-emerald-500 font-bold">Đã kích hoạt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
