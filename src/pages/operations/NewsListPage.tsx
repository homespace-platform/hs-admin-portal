import { useEffect, useState, type FormEvent } from "react";
import { FileText, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import UserPagination from "@/components/users/UserPagination";
import adminNewsService from "@/services/admin-news.service";
import type { NewsCategory, NewsStatus, NewsSummary } from "@/types/news.type";
import { getApiErrorMessage } from "@/utils/apiError";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  MARKET: "Thị trường",
  LEGAL: "Pháp lý",
  GUIDE: "Cẩm nang",
  INVESTMENT: "Đầu tư",
  TREND: "Xu hướng",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function NewsListPage() {
  const [articles, setArticles] = useState<NewsSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<NewsStatus | "">("");
  const [category, setCategory] = useState<NewsCategory | "">("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminNewsService
      .findAll({
        page,
        size,
        keyword,
        status: status || undefined,
        category: category || undefined,
      })
      .then((response) => {
        if (cancelled) return;
        setArticles(response.result);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          getApiErrorMessage(error, "Không thể tải danh sách tin tức."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, keyword, page, reloadVersion, size, status]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setKeyword(searchInput.trim());
  }

  async function deleteArticle(article: NewsSummary) {
    if (!window.confirm(`Xóa bài viết “${article.title}”?`)) return;
    try {
      await adminNewsService.delete(article.id);
      toast.success("Đã xóa bài viết.");
      setLoading(true);
      if (articles.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadVersion((current) => current + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa bài viết."));
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Vận hành &amp; Hỗ trợ
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            Quản lý tin tức
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý các bài viết được đăng trên HomeSpace.
          </p>
        </div>
        <Link
          to="/operations/news/create"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm tin mới
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row">
          <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tiêu đề bài viết..."
              aria-label="Tìm kiếm bài viết"
              className="form-input pl-10"
            />
          </form>
          <select
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value as NewsStatus | "");
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="form-input lg:w-44"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
          <select
            value={category}
            onChange={(event) => {
              setLoading(true);
              setCategory(event.target.value as NewsCategory | "");
              setPage(1);
            }}
            aria-label="Lọc theo danh mục"
            className="form-input lg:w-44"
          >
            <option value="">Tất cả danh mục</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-border bg-muted/35 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-bold">Bài viết</th>
                <th className="px-5 py-3 font-bold">Danh mục</th>
                <th className="px-5 py-3 font-bold">Tags</th>
                <th className="px-5 py-3 font-bold">Trạng thái</th>
                <th className="px-5 py-3 font-bold">Người viết</th>
                <th className="px-5 py-3 font-bold">Ngày tạo</th>
                <th className="px-5 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading &&
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {article.thumbnailUrl ? (
                          <img
                            src={article.thumbnailUrl}
                            alt=""
                            className="h-12 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-20 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="max-w-xs truncate font-bold text-foreground">
                              {article.title}
                            </p>
                            {article.featured && (
                              <Star
                                aria-label="Bài nổi bật"
                                className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
                              />
                            )}
                          </div>
                          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            /{article.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-foreground">
                      {CATEGORY_LABELS[article.category]}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-48 flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${article.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
                      >
                        {article.status === "PUBLISHED"
                          ? "Đã xuất bản"
                          : "Bản nháp"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {article.authorName}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {article.createdAt
                        ? dateFormatter.format(new Date(article.createdAt))
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/operations/news/${article.id}/edit`}
                          aria-label={`Sửa ${article.title}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Xóa ${article.title}`}
                          onClick={() => void deleteArticle(article)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            Đang tải danh sách...
          </div>
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <UserPagination
            page={page}
            size={size}
            totalPages={totalPages}
            totalElements={totalElements}
            loading={loading}
            itemLabel="bài viết"
            onPageChange={(value) => {
              setLoading(true);
              setPage(value);
            }}
            onSizeChange={(value) => {
              setLoading(true);
              setSize(value);
            }}
          />
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-base font-bold text-foreground">
        Chưa có bài viết nào
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Tạo bài viết đầu tiên để bắt đầu xây dựng nội dung cho trang tin tức.
      </p>
      <Link
        to="/operations/news/create"
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted"
      >
        <Plus className="h-4 w-4" /> Tạo bài viết đầu tiên
      </Link>
    </div>
  );
}
