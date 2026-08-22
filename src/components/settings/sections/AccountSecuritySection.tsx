import React, { useState } from "react";
import axios from "axios";
import { Lock, Check, LoaderCircle, Shield } from "lucide-react";
import userService from "@/services/user.service";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "sonner";

export default function AccountSecuritySection() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setSavingPassword(true);
    try {
      await userService.updatePassword({
        oldPassword: currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công! Hệ thống sẽ tự động đăng xuất sau 1 giây.");
      setTimeout(logout, 1200);
    } catch (error) {
      const responseMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      toast.error(
        typeof responseMessage === "string" && responseMessage.trim()
          ? responseMessage
          : "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      {/* 1. Thay đổi mật khẩu */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-primary" />
          <span>Thay đổi mật khẩu</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Để bảo vệ tài khoản quản trị, hãy sử dụng mật khẩu mạnh bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>

        <form onSubmit={handleChangePassword} className="bg-card rounded-3xl border border-border p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full h-10 px-3.5 bg-muted/40 focus:bg-background rounded-xl border border-border focus:border-primary text-xs sm:text-sm text-foreground outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Cập nhật mật khẩu</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Bảo mật & Xác thực Keycloak */}
      <div className="bg-card rounded-3xl border border-border p-6 space-y-3 shadow-2xs">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>Bảo mật đăng nhập SSO</span>
        </h4>
        <p className="text-xs text-muted-foreground">
          Tài khoản quản trị viên được bảo vệ bằng Keycloak Identity Provider với mã hóa PKCE S256 và xác thực token JWT đa lớp.
        </p>
      </div>
    </div>
  );
}
