import { useEffect, useState, type FormEvent } from "react";
import { X, Pencil, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateAdminPermission } from "@/services/admin-rbac.service";
import type { AdminPermission } from "@/types/rbac.type";
import { toast } from "sonner";
import { formatDate, formatAuditActor, getApiErrorMessage } from "@/utils/userUtils";

interface PermissionDetailsModalProps {
  isOpen: boolean;
  selectedPermission: AdminPermission | null;
  loadingDetails: boolean;
  isInitialEditing?: boolean;
  onClose: () => void;
  onPermissionUpdated: (permission: AdminPermission) => void;
}

export default function PermissionDetailsModal({
  isOpen,
  selectedPermission,
  loadingDetails,
  isInitialEditing = false,
  onClose,
  onPermissionUpdated,
}: PermissionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!selectedPermission) return;
    setDescription(selectedPermission.description ?? "");
    setIsEditing(isInitialEditing);
  }, [selectedPermission, isInitialEditing]);

  if (!isOpen || !selectedPermission) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateAdminPermission(selectedPermission.id, {
        description: description.trim(),
      });
      onPermissionUpdated(updated);
      setIsEditing(false);
      toast.success(`Đã cập nhật quyền ${updated.name}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật quyền hạn."));
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
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground font-mono">{selectedPermission.name}</h3>
            <p className="text-xs text-muted-foreground">Quyền hạn hệ thống</p>
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
          <div className="flex min-h-40 items-center justify-center text-xs text-muted-foreground">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary mr-2" />
            Đang tải chi tiết...
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold">Mã quyền</label>
              <p className="h-10 px-3 rounded-xl bg-muted/40 border border-border flex items-center font-mono font-bold">
                {selectedPermission.name}
              </p>
              <p className="text-[11px] text-muted-foreground">Tên quyền do seeder tạo, không chỉnh sửa được.</p>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-xl text-xs font-bold cursor-pointer">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer">
                {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase">Mã quyền</span>
              <Badge variant="secondary" className="mt-1 font-mono text-[11px] font-bold">
                {selectedPermission.name}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase">Mô tả</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {selectedPermission.description || "Chưa có mô tả"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 text-[11px]">
              <div className="flex justify-between gap-3 font-mono">
                <span className="text-muted-foreground font-sans">Permission ID:</span>
                <span className="font-semibold truncate">{selectedPermission.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ngày tạo:</span>
                <span>{formatDate(selectedPermission.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Cập nhật:</span>
                <span>{formatDate(selectedPermission.updatedAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Tạo bởi:</span>
                <span className="text-right break-words">{formatAuditActor(selectedPermission.createdBy)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Cập nhật bởi:</span>
                <span className="text-right break-words">{formatAuditActor(selectedPermission.updatedBy)}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl text-xs font-bold cursor-pointer">
                <Pencil className="w-4 h-4 mr-1.5" />
                Chỉnh sửa mô tả
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
