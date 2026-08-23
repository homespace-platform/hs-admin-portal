import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserPaginationProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
}

export default function UserPagination({
  page,
  size,
  totalPages,
  totalElements,
  loading,
  onPageChange,
  onSizeChange,
}: UserPaginationProps) {
  return (
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
              onSizeChange(Number(e.target.value));
              onPageChange(1);
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
            onClick={() => onPageChange(Math.max(page - 1, 1))}
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
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages || loading}
            className="rounded-lg cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
