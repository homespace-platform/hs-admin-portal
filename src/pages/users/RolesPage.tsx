import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getAdminRoles,
  getAdminRoleById,
  getAllAdminPermissions,
} from "@/services/admin-rbac.service";
import type { AdminPermission, AdminRole } from "@/types/rbac.type";
import RoleStatsCards from "@/components/rbac/RoleStatsCards";
import RbacToolbar from "@/components/rbac/RbacToolbar";
import RoleTable from "@/components/rbac/RoleTable";
import UserPagination from "@/components/users/UserPagination";
import RoleDetailsModal from "@/components/rbac/RoleDetailsModal";
import { getApiErrorMessage } from "@/components/users/userUtils";

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<AdminPermission[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInitialEditing, setIsInitialEditing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminRoles(page, size, true);
      setRoles(data.result || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (data.result?.length ?? 0));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách vai trò."));
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    getAllAdminPermissions()
      .then(setAllPermissions)
      .catch(() => setAllPermissions([]));
  }, []);

  const openDetails = async (role: AdminRole, editing: boolean) => {
    setSelectedRole(role);
    setIsInitialEditing(editing);
    setIsDetailsOpen(true);
    setLoadingDetails(true);
    try {
      setSelectedRole(await getAdminRoleById(role.id));
    } catch {
      // keep list snapshot
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredRoles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((role) =>
      [role.name, role.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [roles, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <RoleStatsCards
        totalElements={totalElements}
        adminCount={roles.filter((role) => role.name === "ADMIN").length}
        userCount={roles.filter((role) => role.name === "USER").length}
        withPermissionsCount={roles.filter((role) => (role.permissions?.length ?? 0) > 0).length}
      />

      <RbacToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Tìm theo tên hoặc mô tả vai trò..."
        loading={loading}
        onRefresh={fetchRoles}
      />

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
        <RoleTable
          roles={filteredRoles}
          loading={loading}
          page={page}
          size={size}
          onViewDetails={(role) => openDetails(role, false)}
          onStartEdit={(role) => openDetails(role, true)}
        />
        <UserPagination
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          loading={loading}
          itemLabel="vai trò"
          onPageChange={setPage}
          onSizeChange={(nextSize) => {
            setSize(nextSize);
            setPage(1);
          }}
        />
      </div>

      <RoleDetailsModal
        isOpen={isDetailsOpen}
        selectedRole={selectedRole}
        loadingDetails={loadingDetails}
        isInitialEditing={isInitialEditing}
        allPermissions={allPermissions}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRole(null);
        }}
        onRoleUpdated={(updated) => {
          setSelectedRole(updated);
          setRoles((prev) => prev.map((role) => (role.id === updated.id ? updated : role)));
        }}
      />
    </div>
  );
}
