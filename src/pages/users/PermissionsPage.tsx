import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getAdminPermissions,
  getAdminPermissionById,
} from "@/services/admin-rbac.service";
import type { AdminPermission } from "@/types/rbac.type";
import PermissionStatsCards from "@/components/rbac/PermissionStatsCards";
import RbacToolbar from "@/components/rbac/RbacToolbar";
import PermissionTable from "@/components/rbac/PermissionTable";
import UserPagination from "@/components/users/UserPagination";
import PermissionDetailsModal from "@/components/rbac/PermissionDetailsModal";
import { getApiErrorMessage } from "@/utils/userUtils";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPermission, setSelectedPermission] = useState<AdminPermission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInitialEditing, setIsInitialEditing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPermissions(page, size);
      setPermissions(data.result || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (data.result?.length ?? 0));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách quyền hạn."));
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const openDetails = async (permission: AdminPermission, editing: boolean) => {
    setSelectedPermission(permission);
    setIsInitialEditing(editing);
    setIsDetailsOpen(true);
    setLoadingDetails(true);
    try {
      setSelectedPermission(await getAdminPermissionById(permission.id));
    } catch {
      // keep snapshot
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((permission) =>
      [permission.name, permission.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [permissions, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PermissionStatsCards
        totalElements={totalElements}
        userScopeCount={permissions.filter((item) => item.name.startsWith("USER_")).length}
        roleScopeCount={permissions.filter((item) => item.name.startsWith("ROLE_")).length}
        otherCount={permissions.filter(
          (item) => !item.name.startsWith("USER_") && !item.name.startsWith("ROLE_"),
        ).length}
      />

      <RbacToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Tìm theo mã hoặc mô tả quyền..."
        loading={loading}
        onRefresh={fetchPermissions}
      />

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
        <PermissionTable
          permissions={filteredPermissions}
          loading={loading}
          page={page}
          size={size}
          onViewDetails={(permission) => openDetails(permission, false)}
          onStartEdit={(permission) => openDetails(permission, true)}
        />
        <UserPagination
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          loading={loading}
          itemLabel="quyền hạn"
          onPageChange={setPage}
          onSizeChange={(nextSize) => {
            setSize(nextSize);
            setPage(1);
          }}
        />
      </div>

      <PermissionDetailsModal
        isOpen={isDetailsOpen}
        selectedPermission={selectedPermission}
        loadingDetails={loadingDetails}
        isInitialEditing={isInitialEditing}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPermission(null);
        }}
        onPermissionUpdated={(updated) => {
          setSelectedPermission(updated);
          setPermissions((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
        }}
      />
    </div>
  );
}
