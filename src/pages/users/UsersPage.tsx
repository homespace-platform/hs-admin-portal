import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import {
  getAdminUsers,
  setAdminUserActive,
  getAdminUserById,
  resendAdminUserInvitation,
} from "@/services/admin-user.service";
import type { AdminUser } from "@/types/user.type";

import UserStatsCards from "@/components/users/UserStatsCards";
import UserToolbar, { type StatusFilterType } from "@/components/users/UserToolbar";
import UserTable from "@/components/users/UserTable";
import UserPagination from "@/components/users/UserPagination";
import CreateUserModal from "@/components/users/CreateUserModal";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import { getApiErrorMessage } from "@/components/users/userUtils";

export default function UsersPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  // List & Pagination State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Selected User & Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isInitialEditing, setIsInitialEditing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Async Action Loaders
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(page, size);
      setUsers(data.result || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (data.result?.length ?? 0));
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Không thể tải danh sách người dùng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Details Modal
  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsInitialEditing(false);
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const details = await getAdminUserById(user.id);
      setSelectedUser(details);
    } catch {
      // Fallback to existing user object
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Edit Mode directly
  const handleStartEdit = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsInitialEditing(true);
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const details = await getAdminUserById(user.id);
      setSelectedUser(details);
    } catch {
      // Fallback to existing user object
    } finally {
      setLoadingDetails(false);
    }
  };

  // Update user in local list when edited
  const handleUserUpdated = (updated: AdminUser) => {
    setSelectedUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  // Toggle active/inactive
  const handleToggleActive = async (user: AdminUser) => {
    const nextStatus = !user.active;
    const actionText = nextStatus ? "mở khóa" : "vô hiệu hóa";

    if (!nextStatus && user.id === currentUserId) {
      toast.error("Bạn không thể khóa tài khoản đang đăng nhập.");
      return;
    }

    setUpdatingId(user.id);
    try {
      await setAdminUserActive(user.id, nextStatus);
      toast.success(`Đã ${actionText} tài khoản @${user.username} thành công!`);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextStatus } : u)),
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, active: nextStatus } : null));
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Không thể ${actionText} tài khoản. Vui lòng thử lại!`),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Resend invitation email
  const handleResendInvitation = async (user: AdminUser) => {
    if (!user.active) {
      toast.error("Hãy mở khóa tài khoản trước khi gửi lại lời mời.");
      return;
    }

    setResendingId(user.id);
    try {
      await resendAdminUserInvitation(user.id);
      toast.success(`Đã gửi lại email kích hoạt tới ${user.email}. Link mới có hiệu lực 12 giờ.`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : error instanceof Error
        ? error.message
        : "Không thể gửi lại lời mời.";
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  // Client-side filtering on current page
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        [u.username, u.email, u.firstName, u.lastName, u.phone]
          .filter(Boolean)
          .some((field) =>
            field!.toLowerCase().includes(searchQuery.toLowerCase().trim()),
          );

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active) ||
        (statusFilter === "INACTIVE" && !u.active);

      const matchRole =
        roleFilter === "ALL" ||
        u.role?.toUpperCase() === roleFilter.toUpperCase();

      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  // Statistics
  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;
  const onboardedCount = users.filter((u) => u.onBoarded).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Summary Statistics Cards */}
      <UserStatsCards
        totalElements={totalElements}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        onboardedCount={onboardedCount}
      />

      {/* 2. Search, Filter & Action Toolbar */}
      <UserToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        loading={loading}
        onRefresh={fetchUsers}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 3. Data Table & Pagination */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
        <UserTable
          users={filteredUsers}
          loading={loading}
          page={page}
          size={size}
          currentUserId={currentUserId}
          updatingId={updatingId}
          onViewDetails={handleViewDetails}
          onStartEdit={handleStartEdit}
          onToggleActive={handleToggleActive}
        />

        <UserPagination
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          loading={loading}
          onPageChange={setPage}
          onSizeChange={(newSize) => {
            setSize(newSize);
            setPage(1);
          }}
        />
      </div>

      {/* 4. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* 5. User Details & Edit Modal */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        selectedUser={selectedUser}
        loadingDetails={loadingDetails}
        isInitialEditing={isInitialEditing}
        currentUserId={currentUserId}
        updatingId={updatingId}
        resendingId={resendingId}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        onToggleActive={handleToggleActive}
        onResendInvitation={handleResendInvitation}
      />
    </div>
  );
}
