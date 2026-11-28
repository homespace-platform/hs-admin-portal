import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  MetricCard,
  MetricRows,
  PageHeading,
  QueryFeedback,
  Section,
  controlClass,
} from "@/components/dashboard/DashboardParts";
import { count, label, money, object } from "@/lib/dashboard-report";
import { useDashboardData } from "@/hooks/useDashboardData";
import ReportChart, {
  type ChartSeries,
} from "@/components/dashboard/ReportChart";
import { csvField, statisticsRangeError } from "@/lib/dashboard-report";
import type { Statistics } from "@/services/admin-dashboard.service";

function values(value: unknown) {
  return Array.isArray(value) ? value : null;
}
function mappedSeries(value: unknown): ChartSeries[] {
  const map = object(value);
  return map
    ? Object.entries(map).map(([key, items]) => ({
        key,
        label: label(key),
        values: values(items),
      }))
    : [];
}
function CountList({ data }: { data: unknown }) {
  const map = object(data);
  return map ? (
    <dl className="space-y-3">
      {Object.entries(map).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <dt className="text-muted-foreground">{label(key)}</dt>
          <dd className="font-semibold tabular-nums">{count(value)}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <Empty />
  );
}
function MetricTable({
  rows,
  columns,
}: {
  rows: unknown;
  columns: [string, string, ("money" | "age")?][];
}) {
  if (!Array.isArray(rows) || rows.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            {columns.map(([key, title]) => (
              <th key={key} className="px-3 pb-3 font-medium">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => {
            const row = object(item);
            return (
              row && (
                <tr key={i} className="border-t border-border">
                  {columns.map(([key, , format]) => (
                    <td key={key} className="p-3 tabular-nums">
                      {format === "money"
                        ? money(row[key])
                        : typeof row[key] === "string"
                          ? label(row[key])
                          : count(row[key])}
                    </td>
                  ))}
                </tr>
              )
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function StatisticFilters({
  range,
  onApply,
}: {
  range: Statistics["range"];
  onApply: (query: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = String(form.get("from")),
      to = String(form.get("to")),
      granularity = String(form.get("granularity"));
    const invalid = statisticsRangeError(from, to, granularity);
    setError(invalid);
    if (!invalid)
      onApply(new URLSearchParams({ from, to, granularity }).toString());
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5 text-xs font-medium">
          Từ ngày
          <input
            name="from"
            type="date"
            required
            defaultValue={range.from}
            className={controlClass}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Đến ngày
          <input
            name="to"
            type="date"
            required
            defaultValue={range.to}
            className={controlClass}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Nhóm dữ liệu
          <select
            name="granularity"
            defaultValue={range.granularity}
            className={controlClass}
          >
            <option value="DAY">Theo ngày</option>
            <option value="MONTH">Theo tháng</option>
          </select>
        </label>
        <Button type="submit" className="h-11 rounded-xl px-5">
          Áp dụng
        </Button>
        <span className="pb-3 text-xs text-muted-foreground">
          Giờ Việt Nam · tối đa 92 ngày hoặc 36 tháng
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

export default function StatisticsPage() {
  const [query, setQuery] = useState("");
  const request = useDashboardData<Statistics>(
    `/api/v1/admin/statistics${query ? `?${query}` : ""}`,
  );
  const data = request.data;
  const buckets = Array.isArray(data?.series.buckets)
    ? (data.series.buckets as string[])
    : [];
  function exportCsv() {
    if (!data) return;
    const rows: unknown[][] = [
      ["Từ ngày", data.range.from, "Đến ngày", data.range.to],
      ["Chỉ số", "Hiện tại", "Kỳ trước"],
    ];
    const names: Record<string, string> = {
      newUsers: "Người dùng mới",
      submittedListings: "Tin gửi duyệt",
      signedContracts: "Hợp đồng đã ký",
      gmvVnd: "Giá trị giao dịch thuê",
      membershipRevenueVnd: "Doanh thu hội viên",
    };
    for (const [key, metric] of Object.entries(data.kpi)) {
      const item = object(metric);
      if (item) rows.push([names[key] ?? key, item.value, item.previous]);
    }
    rows.push([], ["Loại dữ liệu", "Nhóm", "Thời gian", "Giá trị"]);
    for (const [key, series] of Object.entries(data.series)) {
      if (key === "buckets" || series == null) continue;
      const groups = Array.isArray(series) ? { Tổng: series } : object(series);
      if (groups)
        for (const [group, seriesValues] of Object.entries(groups))
          if (Array.isArray(seriesValues))
            buckets.forEach((bucket, i) =>
              rows.push([
                names[key] ?? key,
                label(group),
                bucket,
                seriesValues[i],
              ]),
            );
    }
    const blob = new Blob(
      ["\uFEFF", rows.map((row) => row.map(csvField).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `homespace-thong-ke-${data.range.from}_${data.range.to}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return (
    <div className="space-y-6 pb-8">
      <PageHeading
        title="Thống kê hệ thống"
        subtitle="Tăng trưởng, hoạt động thuê nhà và chất lượng vận hành."
        generatedAt={data?.generatedAt}
        loading={request.loading}
        onRefresh={request.refresh}
      >
        <Button
          variant="outline"
          disabled={!data}
          onClick={exportCsv}
          className="h-11 rounded-xl px-4"
        >
          <Download className="size-4" />
          Xuất báo cáo CSV
        </Button>
      </PageHeading>
      <QueryFeedback
        loading={request.loading}
        error={request.error}
        degraded={data?.degraded}
      />
      {data && (
        <>
          <StatisticFilters key={query} range={data.range} onApply={setQuery} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {(
              [
                ["newUsers", "Người dùng mới"],
                ["submittedListings", "Tin gửi duyệt"],
                ["signedContracts", "Hợp đồng đã ký"],
                ["gmvVnd", "Giá trị giao dịch thuê"],
                ["membershipRevenueVnd", "Doanh thu hội viên"],
              ] as const
            ).map(([key, title]) => {
              const metric = object(data.kpi[key]);
              return (
                <MetricCard
                  key={key}
                  label={title}
                  value={
                    key.endsWith("Vnd")
                      ? money(metric?.value)
                      : count(metric?.value)
                  }
                  note={
                    metric
                      ? `Kỳ trước ${key.endsWith("Vnd") ? money(metric.previous) : count(metric.previous)}`
                      : "Chưa có dữ liệu hoặc quyền xem"
                  }
                />
              );
            })}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Section title="Tăng trưởng & hợp đồng">
              <ReportChart
                buckets={buckets}
                series={[
                  {
                    key: "users",
                    label: "Người dùng mới",
                    values: values(data.series.newUsers),
                  },
                  {
                    key: "listings",
                    label: "Tin gửi duyệt",
                    values: values(data.series.submittedListings),
                  },
                  {
                    key: "contracts",
                    label: "Hợp đồng đã ký",
                    values: values(data.series.signedContracts),
                  },
                ]}
              />
            </Section>
            <Section
              title="Doanh thu hội viên theo gói"
              note="Giá trị VND tại thời điểm thanh toán."
            >
              <ReportChart
                buckets={buckets}
                series={mappedSeries(data.series.membershipByTier)}
                currency
                bars
              />
            </Section>
            <Section
              title="Giá trị giao dịch theo loại"
              note="Giá trị gộp các khoản xác nhận trong kỳ, bao gồm khoản cọc thuộc phạm vi báo cáo."
            >
              <ReportChart
                buckets={buckets}
                series={mappedSeries(data.series.gmvByType)}
                currency
                bars
              />
            </Section>
            <Section title="Duyệt tin theo thời gian">
              <ReportChart
                buckets={buckets}
                series={[
                  ["approved", "Đã duyệt"],
                  ["rejected", "Từ chối"],
                  ["violation", "Vi phạm"],
                ].map(([key, title]) => ({
                  key,
                  label: title,
                  values: values(object(data.breakdown.moderation)?.[key]),
                }))}
                bars
              />
            </Section>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Section title="Tin đăng theo trạng thái">
              <CountList data={data.breakdown.listingsByStatus} />
            </Section>
            <Section title="Hợp đồng theo trạng thái">
              <CountList data={data.breakdown.contractsByStatus} />
            </Section>
            <Section title="Loại hợp đồng">
              <CountList data={data.breakdown.contractsByKind} />
            </Section>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Nguồn cung theo tỉnh/thành">
              <MetricTable
                rows={data.breakdown.listingsByCity}
                columns={[
                  ["city", "Tỉnh / thành phố"],
                  ["count", "Tin gửi duyệt"],
                ]}
              />
            </Section>
            <Section title="Kênh thanh toán hội viên">
              <MetricTable
                rows={data.breakdown.membershipByProvider}
                columns={[
                  ["provider", "Kênh"],
                  ["orders", "Đơn đã thanh toán"],
                  ["amountVnd", "Giá trị VND", "money"],
                ]}
              />
            </Section>
            <Section title="Yêu cầu thuê">
              <CountList
                data={object(data.breakdown.rentalRequests)?.byStatus}
              />
            </Section>
            <Section
              title="Lịch hẹn"
              note="Hoàn tất lịch hẹn chỉ thể hiện đã qua lịch, chưa xác nhận khách đến."
            >
              <CountList data={object(data.breakdown.appointments)?.byStatus} />
            </Section>
          </div>
          <Section title="Chuyển đổi theo nhóm dữ liệu">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["registeredToOnboarded", "Đăng ký → thiết lập"],
                ["registeredToKyc", "Đăng ký → KYC"],
                ["submittedToPublished", "Gửi tin → xuất bản"],
                ["contractCreatedToSigned", "Tạo hợp đồng → ký"],
                ["signedToPaid", "Ký → thanh toán đầu"],
              ].map(([key, title]) => {
                const rate = object(data.funnel[key]);
                const den = Number(rate?.den);
                return (
                  <div key={key} className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="mt-3 text-xl font-bold tabular-nums">
                      {rate && den > 0
                        ? `${count((Number(rate.num) / den) * 100)}%`
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {count(rate?.num)} / {count(rate?.den)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>
          <div className="grid gap-5 lg:grid-cols-2">
            {[
              ["rentalRequests", "Phản hồi yêu cầu thuê"],
              ["appointments", "Phản hồi lịch hẹn"],
            ].map(([key, title]) => (
              <Section
                key={key}
                title={title}
                note="Chỉ đo phản hồi đầu tiên có ghi nhận, dữ liệu cũ chưa có mốc được để trống."
              >
                <MetricRows
                  data={object(object(data.breakdown.responseSla)?.[key])}
                  fields={[
                    ["observations", "Mẫu đo hợp lệ"],
                    ["medianSec", "Trung vị phản hồi", "age"],
                    ["p90Sec", "90% phản hồi trong", "age"],
                  ]}
                />
              </Section>
            ))}
            <Section title="Hội viên đang hiệu lực">
              <CountList
                data={object(data.breakdown.membershipActive)?.byTier}
              />
              <div className="mt-5">
                <MetricRows
                  data={object(data.breakdown.membershipActive)}
                  fields={[
                    ["exhausted", "Đã dùng hết lượt"],
                    ["expiring7d", "Hết hạn trong 7 ngày"],
                  ]}
                />
              </div>
            </Section>
            <Section title="Hoá đơn tháng">
              <CountList data={object(data.breakdown.invoices)?.byStatus} />
              <div className="mt-5">
                <MetricRows
                  data={object(data.breakdown.invoices)}
                  fields={[
                    ["draftOverdue", "Bản nháp đã quá hạn"],
                    ["lateFeeVnd", "Phí chậm đã ghi nhận", "money"],
                  ]}
                />
              </div>
            </Section>
            <Section title="Sự cố vận hành">
              <MetricRows
                data={object(data.breakdown.incidents)}
                fields={[
                  ["open", "Đang mở"],
                  ["observations", "Mẫu thời gian khắc phục"],
                  ["mttrMedianSec", "Trung vị khắc phục", "age"],
                  ["mttrP90Sec", "90% khắc phục trong", "age"],
                ]}
              />
            </Section>
            <Section title="Chất lượng xét duyệt">
              <MetricRows
                data={object(data.breakdown.moderation)}
                fields={[
                  ["observations", "Mẫu thời gian duyệt"],
                  ["reviewMedianSec", "Trung vị duyệt tin", "age"],
                  ["reviewP90Sec", "90% duyệt trong", "age"],
                ]}
              />
            </Section>
            <Section title="Nguồn cung cần theo dõi">
              <MetricRows
                data={object(data.breakdown.listingSupply)}
                fields={[
                  ["expiringIn7d", "Tin hết hạn trong 7 ngày"],
                  ["overdueUnswept", "Tin đã quá hạn chưa xử lý"],
                ]}
              />
            </Section>
            <Section title="Chấm dứt hợp đồng">
              <MetricRows
                data={object(data.breakdown.terminations)}
                fields={[
                  ["proposed", "Đề nghị trong kỳ"],
                  ["declined", "Từ chối trong kỳ"],
                  ["early", "Kết thúc sớm đã xác minh"],
                ]}
              />
            </Section>
          </div>
          <Section title="Xác minh theo nhà cung cấp">
            <MetricTable
              rows={data.breakdown.kycByProvider}
              columns={[
                ["provider", "Nhà cung cấp"],
                ["total", "Tổng phiên"],
                ["verified", "Đã xác minh"],
                ["rejected", "Từ chối"],
                ["pending", "Còn lại"],
              ]}
            />
          </Section>
          <p className="text-xs leading-5 text-muted-foreground">
            Báo cáo phản ánh trạng thái hiện tại của các hồ sơ trong kỳ đã chọn.
            Một số chỉ số lịch sử chưa có nguồn đo sẽ hiển thị “—”.
          </p>
        </>
      )}
    </div>
  );
}
