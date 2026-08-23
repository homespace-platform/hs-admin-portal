import { ShieldCheck, Eye, Pencil, Calendar } from "lucide-react";
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
import type { AdminRole } from "@/types/rbac.type";
import { formatDate } from "@/components/users/userUtils";
import { formatRoleLabel } from "./rbacUtils";

interface RoleTableProps {
  roles: AdminRole[];
  loading: boolean;
  page: number;
  size: number;
  onViewDetails: (role: AdminRole) => void;
  onStartEdit: (role: AdminRole) => void;
}

export default function RoleTable({
  roles,
  loading,
  page,
  size,
  onViewDetails,
  onStartEdit,
}: RoleTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="border-border">
          <TableHead className="w-12 text-center text-xs font-bold uppercase">STT</TableHead>
          <TableHead className="text-xs font-bold uppercase">Vai trò</TableHead>
          <TableHead className="text-xs font-bold uppercase">Mã</TableHead>
          <TableHead className="text-xs font-bold uppercase">Quyền hạn</TableHead>
          <TableHead className="text-xs font-bold uppercase">Ngày tạo</TableHead>
          <TableHead className="text-right text-xs font-bold uppercase pr-6">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: size }).map((_, index) => (
            <TableRow key={index} className="border-border">
              <TableCell className="text-center">
                <Skeleton className="h-4 w-4 mx-auto rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-36 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 rounded" />
              </TableCell>
              <TableCell className="text-right pr-6">
                <Skeleton className="h-8 w-24 ml-auto rounded-xl" />
              </TableCell>
            </TableRow>
          ))
        ) : roles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-64 text-center">
              <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <ShieldCheck className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold">Không tìm thấy vai trò phù hợp.</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          roles.map((role, index) => {
            const permissionCount = role.permissions?.length ?? 0;
            return (
              <TableRow key={role.id} className="border-border hover:bg-muted/30 transition-colors">
                <TableCell className="text-center font-medium text-xs text-muted-foreground">
                  {(page - 1) * size + index + 1}
                </TableCell>
                <TableCell>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {formatRoleLabel(role.name)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {role.description || "Chưa có mô tả"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={role.name === "ADMIN" ? "default" : "secondary"}
                    className="text-[11px] font-bold font-mono"
                  >
                    {role.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={permissionCount > 0 ? "success" : "outline"} className="text-[11px] font-bold">
                    {permissionCount} quyền
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(role.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onViewDetails(role)}
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onStartEdit(role)}
                      className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Chỉnh sửa mô tả / quyền"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
