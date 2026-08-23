import { Search, RefreshCw, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type StatusFilterType = "ALL" | "ACTIVE" | "INACTIVE";

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (status: StatusFilterType) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export default function UserToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  loading,
  onRefresh,
  onOpenCreateModal,
}: UserToolbarProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Tìm theo tên, email, SĐT, username..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-muted/40 border-border text-xs sm:text-sm"
        />
      </div>

      {/* Filters, Refresh and Create Buttons */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilterType)}
          className="h-10 px-3 rounded-xl border border-border bg-muted/40 text-xs font-medium text-foreground outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã khóa</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
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
          onClick={onRefresh}
          disabled={loading}
          className="h-10 px-3.5 rounded-xl border-border hover:bg-muted text-xs font-semibold gap-1.5 cursor-pointer"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </Button>

        {/* Create User Button */}
        <Button
          variant="default"
          size="default"
          onClick={onOpenCreateModal}
          className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo người dùng</span>
        </Button>
      </div>
    </div>
  );
}
