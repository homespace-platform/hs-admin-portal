import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingTable from "./ListingTable";
import ListingModerationDialog from "./ListingModerationDialog";
import adminListingService from "@/services/admin-listing.service";
import type {
  AdminListingSummaryResponse,
  ListingDetailResponse,
  ListingStatus,
} from "@/types/listing.type";
import { getApiErrorMessage } from "@/utils/apiError";

interface ListingManagementPageProps {
  initialStatus?: ListingStatus;
  pageTitle?: string;
  pageSubtitle?: string;
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "PUBLISHED", label: "Đang hiển thị" },
  { value: "RENTED", label: "Đã cho thuê" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "HIDDEN", label: "Đã ẩn" },
  { value: "VIOLATION", label: "Vi phạm" },
  { value: "DRAFT", label: "Tin nháp" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "submittedAt,desc", label: "Mới gửi duyệt nhất" },
  { value: "publishedAt,desc", label: "Mới phê duyệt nhất" },
  { value: "createdAt,desc", label: "Mới tạo nhất" },
  { value: "updatedAt,desc", label: "Mới cập nhật nhất" },
  { value: "title,asc", label: "Tiêu đề A-Z" },
];

export default function ListingManagementPage({
  initialStatus,
  pageTitle = "Quản lý tin đăng",
  pageSubtitle = "Toàn bộ danh sách bài đăng cho thuê trên toàn hệ thống",
}: ListingManagementPageProps) {
  const navigate = useNavigate();

  // State
  const [listings, setListings] = useState<AdminListingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || "ALL");
  const [keywordInput, setKeywordInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [sortOption, setSortOption] = useState("submittedAt,desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Moderation Dialog State
  const [moderationTarget, setModerationTarget] = useState<{
    listing: AdminListingSummaryResponse | ListingDetailResponse | null;
    status: ListingStatus | null;
  }>({
    listing: null,
    status: null,
  });

  // Debounce search by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextKeyword = keywordInput.trim();
      setDebouncedKeyword((prev) => {
        if (prev !== nextKeyword) {
          setPage(1);
          return nextKeyword;
        }
        return prev;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // Fetch Admin Listings
  useEffect(() => {
    let active = true;

    const statusParam =
      statusFilter !== "ALL" ? (statusFilter as ListingStatus) : undefined;

    adminListingService
      .findAll({
        page,
        size,
        status: statusParam,
        keyword: debouncedKeyword || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sort: sortOption,
      })
      .then((res) => {
        if (active) {
          setListings(res.result || []);
          setTotalPages(res.totalPages || 1);
          setTotalElements(res.totalElements || 0);
          setLoading(false);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Admin listings fetch error:", error);
          const msg = getApiErrorMessage(error, "Không thể tải danh sách tin đăng.");
          setErrorMessage(msg);
          setListings([]);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    page,
    size,
    statusFilter,
    debouncedKeyword,
    fromDate,
    toDate,
    sortOption,
    reloadKey,
  ]);

  function handleOpenModeration(
    listing: AdminListingSummaryResponse | ListingDetailResponse,
    targetStatus: ListingStatus
  ) {
    setModerationTarget({
      listing,
      status: targetStatus,
    });
  }

  function handleModerationSuccess() {
    setModerationTarget({ listing: null, status: null });
    // Refetch data
    setReloadKey((k) => k + 1);
  }

  // Generate Smart Pagination page numbers
  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {pageSubtitle} • Tổng cộng <span className="font-bold text-foreground">{totalElements}</span> bài đăng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            className="rounded-xl h-9 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo tiêu đề bài đăng..."
              className="w-full h-10 rounded-xl bg-muted/40 pl-9 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary"
            />
            {keywordInput && (
              <button
                type="button"
                onClick={() => setKeywordInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
                setLoading(true);
              }}
              className="w-full h-10 rounded-xl bg-muted/40 px-3 text-xs font-medium text-foreground border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
                setLoading(true);
              }}
              className="w-full h-10 rounded-xl bg-muted/40 px-3 text-xs font-medium text-foreground border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Lọc theo ngày:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
                setLoading(true);
              }}
              className="h-8 rounded-lg bg-muted/40 px-2.5 text-xs text-foreground border border-border focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
                setLoading(true);
              }}
              className="h-8 rounded-lg bg-muted/40 px-2.5 text-xs text-foreground border border-border focus:border-primary focus:outline-none"
            />
          </div>
          {(fromDate || toDate || debouncedKeyword || statusFilter !== "ALL" || sortOption !== "submittedAt,desc") && (
            <button
              type="button"
              onClick={() => {
                setKeywordInput("");
                setDebouncedKeyword("");
                setStatusFilter("ALL");
                setFromDate("");
                setToDate("");
                setSortOption("submittedAt,desc");
                setPage(1);
                setLoading(true);
              }}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">Không thể tải dữ liệu</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{errorMessage}</p>
          </div>
          <Button
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Thử lại
          </Button>
        </div>
      )}

      {/* Listings Table */}
      {!errorMessage && (
        <ListingTable
          listings={listings}
          loading={loading}
          page={page}
          size={size}
          onViewDetails={(item) => navigate(`/properties/view?id=${item.id}`)}
          onOpenModeration={handleOpenModeration}
        />
      )}

      {/* Pagination */}
      {!loading && !errorMessage && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Trang <span className="font-bold text-foreground">{page}</span> / {totalPages} (Tổng cộng {totalElements} bài đăng)
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                setLoading(true);
              }}
              disabled={page === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {paginationPages.map((p, idx) => {
              if (typeof p === "string") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-xs text-muted-foreground">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPage(p);
                    setLoading(true);
                  }}
                  className={`h-9 min-w-9 px-3 rounded-xl text-xs font-bold transition-colors ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                setLoading(true);
              }}
              disabled={page === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Moderation Action Dialog */}
      <ListingModerationDialog
        isOpen={Boolean(moderationTarget.listing && moderationTarget.status)}
        listing={moderationTarget.listing}
        targetStatus={moderationTarget.status}
        onClose={() => setModerationTarget({ listing: null, status: null })}
        onSuccess={handleModerationSuccess}
      />
    </div>
  );
}
