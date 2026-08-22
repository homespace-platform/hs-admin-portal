import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  X,
  LoaderCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/common/UserAvatar";
import {
  getAdminUsers,
  setAdminUserActive,
  getAdminUserById,
} from "@/services/admin-user.service";
import type { AdminUser } from "@/types/user.type";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Selected user for details modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // User action lock/unlock loading state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size]);

  // Open user details modal
  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const details = await getAdminUserById(user.id);
      setSelectedUser(details);
    } catch {
      // Fallback to existing user object if by-id fails
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle user active / inactive status
  const handleToggleActive = async (user: AdminUser) => {
    const nextStatus = !user.active;
    const actionText = nextStatus ? "mở khóa" : "vô hiệu hóa";
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
      console.error("Failed to update status:", error);
      toast.error(`Không thể ${actionText} tài khoản. Vui lòng thử lại!`);
    } finally {
      setUpdatingId(null);
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

  // Summary statistics
  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Page Header & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tổng người dùng
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {totalElements}
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Đang hoạt động
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Đã vô hiệu hóa
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Onboarding Completed */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Đã Onboarding
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {users.filter((u) => u.onBoarded).length}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Search, Filters & Action Controls Bar */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm theo tên, email, SĐT, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/40 border-border text-xs sm:text-sm"
          />
        </div>

        {/* Filters and Refresh Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="h-10 px-3 rounded-xl border border-border bg-muted/40 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-muted/40 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="USER">Người dùng (USER)</option>
          </select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="default"
            onClick={fetchUsers}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl border-border hover:bg-muted text-xs font-semibold gap-1.5 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 3. Shadcn UI Data Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="w-12 text-center text-xs font-bold uppercase">STT</TableHead>
              <TableHead className="text-xs font-bold uppercase">Người dùng</TableHead>
              <TableHead className="text-xs font-bold uppercase">Email / SĐT</TableHead>
              <TableHead className="text-xs font-bold uppercase">Vai trò</TableHead>
              <TableHead className="text-xs font-bold uppercase">Trạng thái</TableHead>
              <TableHead className="text-xs font-bold uppercase">Ngày tạo</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase pr-6">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: size }).map((_, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-4 mx-auto rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-44 rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-3 w-28 rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 rounded" />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Skeleton className="h-8 w-20 ml-auto rounded-xl" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Users className="w-10 h-10 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">Không tìm thấy người dùng phù hợp.</p>
                    <p className="text-xs text-muted-foreground/70">
                      Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              filteredUsers.map((user, index) => {
                const fullName =
                  [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                  user.username ||
                  "Chưa đặt tên";
                const isUpdating = updatingId === user.id;

                return (
                  <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
                    {/* Index */}
                    <TableCell className="text-center font-medium text-xs text-muted-foreground">
                      {(page - 1) * size + index + 1}
                    </TableCell>

                    {/* User Info (Avatar + Full Name + Username) */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <UserAvatar
                            src={user.avatarUrl}
                            name={fullName}
                            sizeClassName="w-10 h-10 text-sm"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                              user.active ? "bg-emerald-500" : "bg-destructive"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {fullName}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email & Phone */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground font-medium flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span>{user.email || "Chưa có email"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span>{user.phone || "Chưa cập nhật"}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      <Badge
                        variant={user.role?.toUpperCase() === "ADMIN" ? "default" : "secondary"}
                        className="text-[11px] font-bold"
                      >
                        {formatRole(user.role)}
                      </Badge>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={user.active ? "success" : "destructive"}
                        className="text-[11px] font-bold"
                      >
                        {user.active ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details Button */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleViewDetails(user)}
                          className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Xem chi tiết tài khoản"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Toggle Lock / Unlock Button */}
                        <Button
                          variant={user.active ? "destructive" : "outline"}
                          size="icon-sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={isUpdating}
                          className="rounded-lg cursor-pointer"
                          title={user.active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {isUpdating ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                          ) : user.active ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4 text-emerald-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* 4. Pagination Controls Bar */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
          {/* Page Info */}
          <div className="text-muted-foreground font-medium">
            Hiển thị{" "}
            <span className="font-bold text-foreground">
              {totalElements > 0 ? (page - 1) * size + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-bold text-foreground">
              {Math.min(page * size, totalElements)}
            </span>{" "}
            trên tổng số{" "}
            <span className="font-bold text-foreground">{totalElements}</span> người dùng
          </div>

          {/* Page Switcher */}
          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Số dòng:</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-muted/40 font-semibold text-foreground outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Next / Prev Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 py-1 font-bold text-foreground">
                {page} / {totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="rounded-lg cursor-pointer disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. User Details Modal Popup */}
      {selectedUserId && selectedUser && (
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
                  name={
                    [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") ||
                    selectedUser.username
                  }
                  sizeClassName="w-12 h-12 text-lg"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") ||
                      selectedUser.username}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">@{selectedUser.username}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUser(null);
                }}
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
            ) : (
              /* User Information Grid */
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Email</span>
                    <span className="font-semibold text-foreground mt-0.5 block truncate">
                      {selectedUser.email || "N/A"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Số điện thoại</span>
                    <span className="font-semibold text-foreground mt-0.5 block truncate">
                      {selectedUser.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Vai trò</span>
                    <span className="font-bold text-primary mt-0.5 block">
                      {formatRole(selectedUser.role)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Trạng thái</span>
                    <span
                      className={`font-bold mt-0.5 block ${
                        selectedUser.active ? "text-emerald-500" : "text-destructive"
                      }`}
                    >
                      {selectedUser.active ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Ngày sinh</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {selectedUser.dob || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">Giới tính</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {formatGender(selectedUser.gender)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">User ID:</span>
                    <span className="text-foreground font-semibold">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Role ID:</span>
                    <span className="text-foreground font-semibold">{selectedUser.roleId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Ngày tạo:</span>
                    <span className="text-foreground">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Cập nhật:</span>
                    <span className="text-foreground">{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant={selectedUser.active ? "destructive" : "default"}
                    onClick={() => handleToggleActive(selectedUser)}
                    disabled={updatingId === selectedUser.id}
                    className="rounded-xl text-xs font-bold cursor-pointer"
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
      )}
    </div>
  );
}

function formatRole(role?: string | null) {
  if (role === "ADMIN") return "Quản trị viên";
  if (role === "USER") return "Người dùng";
  return role || "Chưa phân vai trò";
}

function formatGender(gender?: string | null) {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";
  return "Chưa cập nhật";
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
