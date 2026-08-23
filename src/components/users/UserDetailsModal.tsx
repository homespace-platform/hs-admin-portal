import { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Pencil,
  Send,
  Lock,
  Unlock,
  LoaderCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/common/UserAvatar";
import { updateAdminUser } from "@/services/admin-user.service";
import type { AdminUser, UpdateAdminUserRequest, UserAuditActor } from "@/types/user.type";
import { toast } from "sonner";
import { formatRole, formatGender, formatDate, parseAuditActor } from "./userUtils";

type EditFormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dob: string;
  gender: "" | "FEMALE" | "MALE" | "OTHER";
};

const EMPTY_EDIT_FORM: EditFormState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
};

interface UserDetailsModalProps {
  isOpen: boolean;
  selectedUser: AdminUser | null;
  loadingDetails: boolean;
  isInitialEditing?: boolean;
  currentUserId?: string;
  updatingId: string | null;
  resendingId: string | null;
  onClose: () => void;
  onUserUpdated: (updatedUser: AdminUser) => void;
  onToggleActive: (user: AdminUser) => void;
  onResendInvitation: (user: AdminUser) => void;
}

export default function UserDetailsModal({
  isOpen,
  selectedUser,
  loadingDetails,
  isInitialEditing = false,
  currentUserId,
  updatingId,
  resendingId,
  onClose,
  onUserUpdated,
  onToggleActive,
  onResendInvitation,
}: UserDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM);

  useEffect(() => {
    if (isInitialEditing && selectedUser) {
      startEditing(selectedUser);
    } else {
      setIsEditing(false);
      setEditForm(EMPTY_EDIT_FORM);
    }
  }, [isInitialEditing, selectedUser]);

  if (!isOpen || !selectedUser) return null;

  const fullName =
    [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ").trim() ||
    selectedUser.username;

  const startEditing = (user: AdminUser) => {
    setEditForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      dob: user.dob ?? "",
      gender: (user.gender as EditFormState["gender"]) ?? "",
    });
    setIsEditing(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: UpdateAdminUserRequest = {
        username: editForm.username.trim() || undefined,
        email: editForm.email.trim() || undefined,
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        dob: editForm.dob || undefined,
        gender: editForm.gender || undefined,
      };

      const updated = await updateAdminUser(selectedUser.id, payload);
      onUserUpdated(updated);
      setIsEditing(false);
      toast.success(`Đã cập nhật thông tin @${updated.username} thành công!`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : error instanceof Error
          ? error.message
          : "Không thể cập nhật người dùng.";
      toast.error(message);
    } finally {
      setIsSaving(false);
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
            <UserAvatar
              src={selectedUser.avatarUrl}
              name={fullName}
              sizeClassName="w-12 h-12 text-lg"
            />
            <div>
              <h3 className="text-base font-bold text-foreground">{fullName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                @{selectedUser.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingDetails ? (
          <div className="flex min-h-48 items-center justify-center text-xs text-muted-foreground">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary mr-2" />
            Đang tải chi tiết...
          </div>
        ) : isEditing ? (
          /* Edit User Form */
          <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Tên</label>
                <Input
                  type="text"
                  placeholder="Van Minh"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Họ</label>
                <Input
                  type="text"
                  placeholder="Nguyen"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Tên đăng nhập
                </label>
                <Input
                  type="text"
                  placeholder="nvminh162"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Số điện thoại
                </label>
                <Input
                  type="tel"
                  placeholder="0353999798"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="nvminh162@gmail.com"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
              />
              {editForm.email.trim().toLowerCase() !==
                (selectedUser.email ?? "").toLowerCase() && (
                  <p className="text-[11px] text-amber-500 font-medium">
                    Đổi email sẽ đặt lại trạng thái xác minh, người dùng cần xác minh lại.
                  </p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Ngày sinh</label>
                <Input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Giới tính</label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      gender: e.target.value as EditFormState["gender"],
                    })
                  }
                  className="h-10 w-full px-3 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="">Chưa cập nhật</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Để trống một ô nghĩa là giữ nguyên giá trị hiện tại.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              >
                {isSaving ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </Button>
            </div>
          </form>
        ) : (
          /* User Information Grid */
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Họ
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {selectedUser.lastName || "Chưa cập nhật"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Tên
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {selectedUser.firstName || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Email
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {selectedUser.email || "N/A"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Số điện thoại
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {selectedUser.phone || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Tên đăng nhập
                </span>
                <span className="font-semibold text-foreground mt-0.5 block truncate font-mono">
                  @{selectedUser.username}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Ngày sinh
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedUser.dob || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Giới tính
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {formatGender(selectedUser.gender)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Vai trò
                </span>
                <span className="font-bold text-primary mt-0.5 block">
                  {formatRole(selectedUser.role)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Trạng thái
                </span>
                <span
                  className={`font-bold mt-0.5 block ${selectedUser.active ? "text-emerald-500" : "text-destructive"
                    }`}
                >
                  {selectedUser.active ? "Đang hoạt động" : "Đã khóa"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                  Onboarding
                </span>
                <span
                  className={`font-bold mt-0.5 block ${selectedUser.onBoarded ? "text-emerald-500" : "text-amber-500"
                    }`}
                >
                  {selectedUser.onBoarded ? "Đã hoàn tất" : "Chưa hoàn tất"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 text-[11px]">
              <div className="flex justify-between gap-3 font-mono">
                <span className="text-muted-foreground font-sans shrink-0">User ID:</span>
                <span className="text-foreground font-semibold truncate">{selectedUser.id}</span>
              </div>
              {selectedUser.avatarStorageId ? (
                <div className="flex justify-between gap-3 font-mono">
                  <span className="text-muted-foreground font-sans shrink-0">Avatar Storage ID:</span>
                  <span className="text-foreground font-semibold truncate">
                    {selectedUser.avatarStorageId}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Ngày tạo:</span>
                <span className="text-foreground truncate">{formatDate(selectedUser.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Cập nhật:</span>
                <span className="text-foreground truncate">{formatDate(selectedUser.updatedAt)}</span>
              </div>
              <AuditActorRow label="Tạo bởi" actor={selectedUser.createdBy} />
              <AuditActorRow label="Cập nhật bởi" actor={selectedUser.updatedBy} />
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => startEditing(selectedUser)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                <span>Chỉnh sửa</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onResendInvitation(selectedUser)}
                disabled={resendingId === selectedUser.id || !selectedUser.active}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                {resendingId === selectedUser.id ? (
                  <LoaderCircle className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                <span>Gửi lại lời mời</span>
              </Button>
              <Button
                variant={selectedUser.active ? "destructive" : "default"}
                onClick={() => onToggleActive(selectedUser)}
                disabled={
                  updatingId === selectedUser.id ||
                  Boolean(selectedUser.id === currentUserId && selectedUser.active)
                }
                className="rounded-xl text-xs font-bold cursor-pointer"
                title={
                  selectedUser.id === currentUserId && selectedUser.active
                    ? "Không thể khóa tài khoản đang đăng nhập"
                    : undefined
                }
              >
                {updatingId === selectedUser.id ? (
                  <LoaderCircle className="w-4 h-4 animate-spin mr-1.5" />
                ) : selectedUser.active ? (
                  <Lock className="w-4 h-4 mr-1.5" />
                ) : (
                  <Unlock className="w-4 h-4 mr-1.5" />
                )}
                <span>{selectedUser.active ? "Khóa tài khoản" : "Mở khóa tài khoản"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditActorRow({
  label,
  actor,
}: {
  label: string;
  actor?: UserAuditActor | string | null;
}) {
  const parsed = parseAuditActor(actor);

  if (!parsed) {
    return (
      <div className="flex justify-between items-center gap-3">
        <span className="text-muted-foreground shrink-0">{label}:</span>
        <span className="text-muted-foreground font-mono">N/A</span>
      </div>
    );
  }

  // If only raw string or ID without detailed profile
  if (!parsed.fullName && !parsed.username && !parsed.email && !parsed.phone) {
    return (
      <div className="flex justify-between items-center gap-3">
        <span className="text-muted-foreground shrink-0">{label}:</span>
        <span className="text-foreground font-mono text-right truncate">
          {parsed.raw || "N/A"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 pt-2 border-t border-border/50 first:border-0 first:pt-0">
      <span className="text-muted-foreground shrink-0 pt-0.5">{label}:</span>
      <div className="text-right space-y-0.5 sm:max-w-[75%]">
        {/* Full Name & @username Badge */}
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {parsed.fullName && (
            <span className="font-bold text-foreground text-xs">
              {parsed.fullName}
            </span>
          )}
          {parsed.username && (
            <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
              @{parsed.username}
            </span>
          )}
        </div>

        {/* Email & Phone */}
        {(parsed.email || parsed.phone) && (
          <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1.5 flex-wrap">
            {parsed.phone && <span>{parsed.phone}</span>}
            {parsed.email && parsed.phone && <span>•</span>}
            {parsed.email && <span>{parsed.email}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

