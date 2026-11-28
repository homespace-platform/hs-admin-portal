import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import UserKycPanel from "@/components/users/UserKycPanel";
import ReportDialog from "@/components/dashboard/ReportDialog";
import {
  Empty,
  MetricCard,
  PageHeading,
  QueryFeedback,
  Section,
  Status,
  controlClass,
} from "@/components/dashboard/DashboardParts";
import { count, dateTime, label } from "@/lib/dashboard-report";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { KycCount, KycPage } from "@/services/admin-dashboard.service";

export default function KycQueuePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const request = useDashboardData<KycPage>(
    `/api/v1/admin/kyc?${query ? `${query}&` : ""}page=${page}&size=20`,
  );
  const counts = useDashboardData<KycCount[]>(
    `/api/v1/admin/kyc/counts${query ? `?${query}` : ""}`,
  );
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["status", "provider", "overdue"]) {
      const value = String(form.get(key) ?? "");
      if (value) params.set(key, value);
    }
    setQuery(params.toString());
    setPage(0);
  }
  const byStatus = counts.data?.reduce<Record<string, number>>(
    (result, row) => {
      result[row.status] = (result[row.status] ?? 0) + row.count;
      return result;
    },
    {},
  );
  function refresh() {
    request.refresh();
    counts.refresh();
  }
  return (
    <div className="space-y-6 pb-8">
      <PageHeading
        title="Xác minh danh tính"
        subtitle="Theo dõi trạng thái xác minh hiện tại và các phiên cần xử lý."
        loading={request.loading || counts.loading}
        onRefresh={refresh}
      />
      <QueryFeedback error={counts.error} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["VERIFIED", "Đã xác minh"],
          ["PENDING", "Đang chờ"],
          ["REVIEW_REQUIRED", "Cần xem xét"],
          ["EXPIRED", "Phiên hết hạn"],
        ].map(([key, title]) => (
          <MetricCard
            key={key}
            label={title}
            value={byStatus ? count(byStatus[key] ?? 0) : "—"}
            note="Trong bộ lọc hiện tại"
          />
        ))}
      </div>
      <Section
        title="Danh sách hồ sơ"
        note="Chỉ hiển thị mã tài khoản và trạng thái. Thông tin giấy tờ được mở riêng theo quyền của bạn."
      >
        <form onSubmit={apply} className="mb-5 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-xs font-medium">
            Trạng thái
            <select name="status" className={controlClass}>
              <option value="">Tất cả</option>
              {[
                "NOT_VERIFIED",
                "PENDING",
                "REVIEW_REQUIRED",
                "VERIFIED",
                "REJECTED",
                "EXPIRED",
              ].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Nhà cung cấp
            <select name="provider" className={controlClass}>
              <option value="">Tất cả</option>
              <option value="VNPT">VNPT eKYC</option>
              <option value="ADMIN">Thủ công</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            Thời hạn
            <select name="overdue" className={controlClass}>
              <option value="">Tất cả</option>
              <option value="true">Đã quá hạn / chờ quá 24 giờ</option>
              <option value="false">Chưa quá hạn</option>
            </select>
          </label>
          <Button type="submit" className="h-11 rounded-xl px-5">
            Áp dụng
          </Button>
        </form>
        <QueryFeedback loading={request.loading} error={request.error} />
        {request.data && (
          <>
            {request.data.items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      {[
                        "Mã tài khoản",
                        "Trạng thái",
                        "Nhà cung cấp",
                        "Tạo phiên",
                        "Hết hạn phiên",
                        "Phân loại",
                        "",
                      ].map((title, i) => (
                        <th key={i} className="px-3 pb-3 font-medium">
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {request.data.items.map((row) => (
                      <tr key={row.userId} className="border-t border-border">
                        <td
                          className="max-w-40 truncate p-3 font-mono text-xs"
                          title={row.userId}
                        >
                          {row.userId}
                        </td>
                        <td className="p-3">
                          <Status value={row.status} />
                        </td>
                        <td className="p-3">
                          {row.provider === "ADMIN"
                            ? "Thủ công"
                            : label(row.provider)}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {dateTime(row.createdAt)}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {dateTime(row.expiresAt)}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {row.rejectionCategory
                            ? label(row.rejectionCategory)
                            : "—"}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            onClick={() => setSelected(row.userId)}
                            className="h-10 rounded-xl"
                          >
                            Xem KYC
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>Chưa có hồ sơ khớp bộ lọc.</Empty>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {count(request.data.total)} hồ sơ · Trang {page + 1} /{" "}
                {Math.max(1, Math.ceil(request.data.total / request.data.size))}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 0 || request.loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-10 rounded-xl"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    (page + 1) * request.data.size >= request.data.total ||
                    request.loading
                  }
                  onClick={() => setPage((p) => p + 1)}
                  className="h-10 rounded-xl"
                >
                  Tiếp
                </Button>
              </div>
            </div>
          </>
        )}
      </Section>
      <ReportDialog
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          refresh();
        }}
        title="Hồ sơ xác minh danh tính"
        description="Xem và xử lý theo quyền KYC hiện tại."
      >
        {selected && <UserKycPanel key={selected} userId={selected} />}
      </ReportDialog>
    </div>
  );
}
