import { useState } from "react";
import axios from "axios";
import { UserPlus, X, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminUser } from "@/services/admin-user.service";
import type { CreateAdminUserRequest } from "@/types/user.type";
import { toast } from "sonner";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [sendInvitation, setSendInvitation] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setEnabled(true);
    setSendInvitation(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      toast.error("Vui lòng điền đầy đủ tên đăng nhập và email.");
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateAdminUserRequest = {
        username: username.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        enabled,
        sendInvitation,
      };

      await createAdminUser(payload);
      toast.success(`Tạo người dùng @${username.trim()} thành công!`);
      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : error instanceof Error
        ? error.message
        : "Không thể tạo người dùng mới.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Tạo người dùng mới</h3>
              <p className="text-xs text-muted-foreground">
                Thêm tài khoản người dùng trực tiếp vào hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create User Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Tên</label>
              <Input
                type="text"
                placeholder="Minh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Họ</label>
              <Input
                type="text"
                placeholder="Nguyen"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Tên đăng nhập <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                required
                placeholder="nvminh1602"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Số điện thoại
              </label>
              <Input
                type="tel"
                placeholder="0388800723"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="nvminh1602@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
            />
          </div>

          {/* Switches / Checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-foreground">
                Kích hoạt tài khoản ngay (Enabled)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-foreground">
                Gửi email thông báo mời tham gia (Send Invitation)
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              {isCreating ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isCreating ? "Đang tạo..." : "Xác nhận tạo"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
