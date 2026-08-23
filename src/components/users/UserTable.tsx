import {
  Users,
  Eye,
  Lock,
  Unlock,
  Phone,
  Mail,
  Calendar,
  LoaderCircle,
  Pencil,
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
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/common/UserAvatar";
import type { AdminUser } from "@/types/user.type";
import { formatRole, formatDate } from "./userUtils";

interface UserTableProps {
  users: AdminUser[];
  loading: boolean;
  page: number;
  size: number;
  currentUserId?: string;
  updatingId: string | null;
  onViewDetails: (user: AdminUser) => void;
  onStartEdit: (user: AdminUser) => void;
  onToggleActive: (user: AdminUser) => void;
}

export default function UserTable({
  users,
  loading,
  page,
  size,
  currentUserId,
  updatingId,
  onViewDetails,
  onStartEdit,
  onToggleActive,
}: UserTableProps) {
  return (
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
          ) : users.length === 0 ? (
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
            users.map((user, index) => {
              const fullName =
                [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                user.username ||
                "Chưa đặt tên";
              const isUpdating = updatingId === user.id;
              const isSelfAccount = user.id === currentUserId;

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
                        onClick={() => onViewDetails(user)}
                        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Xem chi tiết tài khoản"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onStartEdit(user)}
                        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      {/* Toggle Lock / Unlock Button */}
                      <Button
                        variant={user.active ? "destructive" : "outline"}
                        size="icon-sm"
                        onClick={() => onToggleActive(user)}
                        disabled={isUpdating || Boolean(isSelfAccount && user.active)}
                        className="rounded-lg cursor-pointer"
                        title={
                          isSelfAccount && user.active
                            ? "Không thể khóa tài khoản đang đăng nhập"
                            : user.active
                            ? "Khóa tài khoản"
                            : "Mở khóa tài khoản"
                        }
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
    </div>
  );
}
