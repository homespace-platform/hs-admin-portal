import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X, Pencil, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateAdminRole } from "@/services/admin-rbac.service";
import type { AdminPermission, AdminRole } from "@/types/rbac.type";
import { toast } from "sonner";
import { formatDate, formatAuditActor, getApiErrorMessage } from "@/components/users/userUtils";
import { formatRoleLabel } from "./rbacUtils";

interface RoleDetailsModalProps {
  isOpen: boolean;
  selectedRole: AdminRole | null;
  loadingDetails: boolean;
  isInitialEditing?: boolean;
  allPermissions: AdminPermission[];
  onClose: () => void;
  onRoleUpdated: (role: AdminRole) => void;
}

export default function RoleDetailsModal({
  isOpen,
  selectedRole,
  loadingDetails,
  isInitialEditing = false,
  allPermissions,
  onClose,
  onRoleUpdated,
}: RoleDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedRole) return;
    setDescription(selectedRole.description ?? "");
    setSelectedPermissionIds((selectedRole.permissions ?? []).map((item) => item.id));
    setIsEditing(isInitialEditing);
  }, [selectedRole, isInitialEditing]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    for (const permission of allPermissions) {
      const prefix = permission.name.split("_")[0] || "OTHER";
      groups[prefix] = groups[prefix] || [];
      groups[prefix].push(permission);
    }
    return Object.entries(groups);
  }, [allPermissions]);

  if (!isOpen || !selectedRole) return null;

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateAdminRole(selectedRole.id, {
        description: description.trim(),
        permissionIdList: selectedPermissionIds,
      });
      onRoleUpdated(updated);
      setIsEditing(false);
      toast.success(`Đã cập nhật vai trò ${updated.name}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật vai trò."));
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
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">{formatRoleLabel(selectedRole.name)}</h3>
            <p className="text-xs text-muted-foreground font-mono">{selectedRole.name}</p>
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
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Mã vai trò</label>
              <p className="h-10 px-3 rounded-xl bg-muted/40 border border-border flex items-center font-mono font-bold">
                {selectedRole.name}
              </p>
              <p className="text-[11px] text-muted-foreground">Tên vai trò do hệ thống seed, không chỉnh sửa được.</p>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary"
                placeholder="Mô tả vai trò"
              />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Danh sách quyền</p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border p-3 space-y-3">
                {groupedPermissions.map(([group, items]) => (
                  <div key={group} className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissionIds.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-0.5 accent-primary"
                          />
                          <span>
                            <span className="font-mono font-semibold block">{permission.name}</span>
                            <span className="text-muted-foreground">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="rounded-xl text-xs font-bold cursor-pointer">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer">
                {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Tên hiển thị</span>
                <span className="font-semibold text-foreground mt-0.5 block">{formatRoleLabel(selectedRole.name)}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Mã</span>
                <span className="font-mono font-bold text-foreground mt-0.5 block">{selectedRole.name}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase">Mô tả</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {selectedRole.description || "Chưa có mô tả"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                Quyền hạn ({selectedRole.permissions?.length ?? 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedRole.permissions ?? []).length === 0 ? (
                  <span className="text-muted-foreground">Chưa gán quyền</span>
                ) : (
                  selectedRole.permissions?.map((permission) => (
                    <Badge key={permission.id} variant="secondary" className="text-[10px] font-mono font-bold">
                      {permission.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 text-[11px]">
              <div className="flex justify-between gap-3 font-mono">
                <span className="text-muted-foreground font-sans shrink-0">Role ID:</span>
                <span className="text-foreground font-semibold truncate">{selectedRole.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Ngày tạo:</span>
                <span>{formatDate(selectedRole.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Cập nhật:</span>
                <span>{formatDate(selectedRole.updatedAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Tạo bởi:</span>
                <span className="text-right break-words">{formatAuditActor(selectedRole.createdBy)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Cập nhật bởi:</span>
                <span className="text-right break-words">{formatAuditActor(selectedRole.updatedBy)}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl text-xs font-bold cursor-pointer">
                <Pencil className="w-4 h-4 mr-1.5" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
