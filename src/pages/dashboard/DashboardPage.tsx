import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useHasPermission, useCanAccessPath } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import {
  Empty,
  MetricCard,
  MetricRows,
  PageHeading,
  QueryFeedback,
  Section,
  Status,
} from "@/components/dashboard/DashboardParts";
import { age, count, label, money, object } from "@/lib/dashboard-report";
import { useDashboardData } from "@/hooks/useDashboardData";
import ReportChart from "@/components/dashboard/ReportChart";
import type {
  DeliveryHealth,
  Health,
  Overview,
} from "@/services/admin-dashboard.service";

const attention = [
  ["pendingListings", "Tin chờ duyệt", "/properties/pending"],
  ["pendingKyc", "KYC cần xử lý", "/users/kyc"],
  ["openComplaints", "Khiếu nại đang mở", "/operations/complaints"],
  ["openIncidents", "Sự cố vận hành", "/operations/system-alerts"],
  ["stuckMoney", "Khoản tiền cần kiểm tra", "#system-health"],
] as const;
const healthSections: {
  key: keyof Health;
  title: string;
  fields: [string, string, ("age" | "money")?][];
}[] = [
  {
    key: "signing",
    title: "Ký số",
    fields: [
      ["stuck", "Yêu cầu đang kẹt"],
      ["failed24h", "Thất bại / hết hạn trong 24 giờ"],
      ["unmeasuredFailures", "Thất bại chưa có mốc thời gian"],
      ["oldestOpenAgeSec", "Yêu cầu mở lâu nhất", "age"],
    ],
  },
  {
    key: "blockchain",
    title: "Blockchain",
    fields: [
      ["pending", "Chờ ghi nhận"],
      ["submitted", "Đã gửi giao dịch"],
      ["failed", "Ghi nhận thất bại"],
      ["stuck", "Quá 15 phút"],
      ["integrityMismatch", "Tệp thiếu hoặc không khớp"],
      ["openIncidents", "Sự cố đang mở"],
    ],
  },
  {
    key: "payments",
    title: "Thanh toán & chứng từ",
    fields: [
      ["membershipOrdersStuck", "Đơn hội viên quá hạn"],
      ["ethUnsettled", "ETH chờ đối soát"],
      ["overpaymentsAwaitingRefund", "Thanh toán dư chờ hoàn"],
      ["oldestOverpaymentAgeSec", "Khoản dư lâu nhất", "age"],
      ["receiptPdfFailed", "PDF phiếu thu thất bại"],
      ["receiptPdfOverdue", "PDF phiếu thu quá hạn"],
      ["autoConfirmOverdue", "Quá hạn tự xác nhận"],
      ["storageStuck", "Chứng từ chờ lưu"],
    ],
  },
  {
    key: "kyc",
    title: "Xác minh danh tính",
    fields: [
      ["pending", "Phiên đang chờ"],
      ["reviewRequired", "Cần xem xét"],
      ["expired", "Phiên đã hết hạn"],
      ["oldestPendingAgeSec", "Chờ lâu nhất", "age"],
      ["retryNoticeOverdue", "Chưa gửi nhắc thử lại"],
      ["tempEvidenceOverdue", "Dữ liệu tạm quá hạn"],
    ],
  },
  {
    key: "complaints",
    title: "Khiếu nại",
    fields: [
      ["open", "Hồ sơ đang mở"],
      ["escalatedUnassigned", "Chưa có người tiếp nhận"],
      ["waitingAdmin", "Chờ quản trị viên"],
      ["overdue", "Quá hạn phản hồi"],
      ["oldestUnassignedAgeSec", "Chưa tiếp nhận lâu nhất", "age"],
    ],
  },
  {
    key: "responseSla",
    title: "Yêu cầu & lịch hẹn",
    fields: [
      ["rentalPendingOver24h", "Yêu cầu chờ quá 24 giờ"],
      ["rentalPendingOver48h", "Yêu cầu chờ quá 48 giờ"],
      ["appointmentPendingOver24h", "Lịch hẹn chờ quá 24 giờ"],
      ["appointmentPendingOver48h", "Lịch hẹn chờ quá 48 giờ"],
    ],
  },
  {
    key: "dataQuality",
    title: "Chất lượng dữ liệu",
    fields: [
      ["listingTypesWithoutTemplate", "Loại tin chưa có mẫu hợp đồng"],
      ["stuckPublicationReservations", "Lượt đăng đang bị giữ"],
      ["nearbyJobsFailed", "Tác vụ địa điểm thất bại"],
    ],
  },
];
const jobLabels: Record<string, string> = {
  listing_expiration: "Tin đăng hết hạn",
  rental_hold_expiry: "Giữ chỗ hết hạn",
  appointment_pending: "Lịch hẹn đang chờ",
  appointment_completion: "Lịch hẹn đã qua",
  monthly_invoice_overdue: "Hoá đơn quá hạn",
  renewal_response: "Phản hồi gia hạn",
  renewal_signing: "Ký gia hạn",
  amendment_response: "Phản hồi phụ lục",
  amendment_signing: "Ký phụ lục",
  tenant_signing: "Người thuê chờ ký",
  closure_payment: "Thanh toán kết thúc hợp đồng",
  document_generation: "Tạo tài liệu",
};

export default function DashboardPage() {
  const canSystem = useHasPermission(PERMISSIONS.SYSTEM_HEALTH_VIEW);
  const canOverview = useHasPermission(
    [
      PERMISSIONS.LISTING_VIEW,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.KYC_VIEW,
      PERMISSIONS.COMPLAINT_VIEW,
      PERMISSIONS.INCIDENT_VIEW,
      PERMISSIONS.PAYMENT_VIEW,
      PERMISSIONS.CONTRACT_VIEW,
      PERMISSIONS.STATISTICS_VIEW,
      PERMISSIONS.SYSTEM_HEALTH_VIEW,
    ],
    "any",
  );
  const canHealth = useHasPermission(
    [
      PERMISSIONS.SYSTEM_HEALTH_VIEW,
      PERMISSIONS.PAYMENT_VIEW,
      PERMISSIONS.KYC_VIEW,
      PERMISSIONS.COMPLAINT_VIEW,
      PERMISSIONS.STATISTICS_VIEW,
    ],
    "any",
  );
  const canAccess = useCanAccessPath();
  const overview = useDashboardData<Overview>(
    canOverview ? "/api/v1/admin/dashboard/overview" : null,
  );
  const health = useDashboardData<Health>(
    canHealth ? "/api/v1/admin/system-health" : null,
  );
  const delivery = useDashboardData<DeliveryHealth>(
    canSystem ? "/api/v1/notifications/admin/delivery-health" : null,
  );
  const data = overview.data;
  const deliveryData = delivery.data;
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(
      `${data?.businessDate ?? "2000-01-07"}T00:00:00+07:00`,
    );
    day.setUTCDate(day.getUTCDate() - 6 + i);
    return day.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
    });
  });
  function refresh() {
    overview.refresh();
    health.refresh();
    delivery.refresh();
  }
  return (
    <div className="space-y-7 pb-8">
      <PageHeading
        title="Tổng quan"
        subtitle="Công việc cần xử lý và tình hình vận hành HomeSpace."
        generatedAt={data?.generatedAt}
        loading={overview.loading || health.loading}
        onRefresh={refresh}
      />
      <QueryFeedback
        loading={overview.loading}
        error={overview.error}
        degraded={data?.degraded}
      />
      {data && (
        <>
          <section aria-labelledby="attention-title">
            <h2 id="attention-title" className="mb-3 text-sm font-semibold">
              Cần xử lý
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {attention
                .filter(([key]) => data.attention?.[key] != null)
                .map(([key, title, href]) => (
                  <MetricCard
                    key={key}
                    label={title}
                    value={count(data.attention?.[key])}
                    href={
                      href.startsWith("#") || canAccess(href) ? href : undefined
                    }
                    note={
                      key === "pendingListings"
                        ? `Chờ lâu nhất ${age(data.attention?.oldestPendingListingAgeSec)}`
                        : key === "openComplaints"
                          ? `${count(data.attention?.escalatedUnassigned)} chưa tiếp nhận`
                          : undefined
                    }
                  />
                ))}
            </div>
            {!data.attention && (
              <Empty>Chưa có số liệu hàng đợi thuộc quyền của bạn.</Empty>
            )}
          </section>
          <div className="grid gap-5 lg:grid-cols-3">
            {data.users && (
              <Section title="Người dùng">
                <MetricRows
                  data={data.users}
                  fields={[
                    ["newToday", "Mới hôm nay"],
                    ["new7d", "Mới trong 7 ngày"],
                    ["kycVerified", "Đã xác minh KYC"],
                    ["totalUsers", "Tổng người dùng"],
                    ["disabled", "Đang bị khoá"],
                    ["activeAdmins", "Quản trị viên hoạt động"],
                    ["stuckOnboarding", "Chưa hoàn tất thiết lập quá 3 ngày"],
                  ]}
                />
              </Section>
            )}
            {data.rentals && (
              <Section title="Hợp đồng & thuê nhà">
                <MetricRows
                  data={data.rentals}
                  fields={[
                    ["confirmedPaymentsToday", "Thanh toán xác nhận hôm nay"],
                    ["activeContracts", "Hợp đồng đang hiệu lực"],
                  ]}
                />
                {canAccess("/contracts/all") && (
                  <Link
                    to="/contracts/all"
                    className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Xem hợp đồng <ArrowUpRight className="size-4" />
                  </Link>
                )}
              </Section>
            )}
            {data.membership && (
              <Section
                title="Doanh thu hội viên"
                note="Giá trị VND được ghi nhận khi thanh toán."
              >
                <p className="text-xs text-muted-foreground">Tháng hiện tại</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {money(data.membership.revenueMonth)}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Hôm nay{" "}
                  <span className="font-semibold text-foreground">
                    {money(data.membership.revenueToday)}
                  </span>
                </p>
                {canAccess("/analytics/statistics") && (
                  <Link
                    to="/analytics/statistics"
                    className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Xem thống kê <ArrowUpRight className="size-4" />
                  </Link>
                )}
              </Section>
            )}
          </div>
          {Array.isArray(data.users?.daily7d) && (
            <Section title="Tăng trưởng trong 7 ngày">
              <ReportChart
                buckets={buckets}
                series={[
                  {
                    key: "users",
                    label: "Người dùng mới",
                    values: data.users.daily7d,
                  },
                ]}
              />
            </Section>
          )}
        </>
      )}
      {canHealth && (
        <section id="system-health" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5 text-primary" />
              Sức khoẻ hệ thống
            </h2>
            <Status value={health.data?.level} />
          </div>
          <QueryFeedback
            loading={health.loading}
            error={health.error}
            degraded={health.data?.degraded}
          />
          {health.data?.services && (
            <Section
              title="Dịch vụ"
              note="Trạng thái đăng ký dịch vụ, chưa xác nhận khả năng xử lý đầy đủ."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {health.data.services.map((service) => (
                  <div
                    key={service.name}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {service.name}
                      </span>
                      <Status value={service.status} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {service.instances} instance · Lần gia hạn gần nhất{" "}
                      {age(service.lastRenewalAgeSec)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {health.data?.outbox && (
            <Section title="Hàng đợi sự kiện">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      {[
                        "Hàng đợi",
                        "Đang chờ",
                        "Chờ lâu nhất",
                        "Trạng thái",
                      ].map((x) => (
                        <th key={x} className="px-3 pb-3 font-medium">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {health.data.outbox.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-3">
                          {String(row.name ?? row.table ?? "Sự kiện")}
                        </td>
                        <td className="p-3 tabular-nums">
                          {count(row.pending)}
                        </td>
                        <td className="p-3">{age(row.oldestAgeSec)}</td>
                        <td className="p-3">
                          <Status value={String(row.level ?? "UNKNOWN")} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Phân loại thử lại và lỗi cuối chỉ hiện khi nguồn đã ghi nhận.
              </p>
            </Section>
          )}
          {health.data?.jobs && (
            <Section
              title="Công việc quá hạn"
              note="Các hồ sơ ứng viên cần kiểm tra, chưa đủ để kết luận tác vụ nền bị lỗi."
            >
              <div className="grid gap-x-8 sm:grid-cols-2">
                {(Array.isArray(health.data.jobs.overdueWork)
                  ? health.data.jobs.overdueWork
                  : []
                ).map((item, i) => {
                  const row = object(item);
                  return (
                    row && (
                      <div
                        key={i}
                        className="flex justify-between gap-3 border-b border-border py-3 text-sm"
                      >
                        <span>
                          {jobLabels[String(row.key)] ?? "Công việc nền"}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {count(row.count)}
                        </span>
                      </div>
                    )
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Lịch sử chạy tác vụ chưa có nguồn ghi nhận đầy đủ.
              </p>
            </Section>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {healthSections
              .filter((section) => health.data?.[section.key] != null)
              .map((section) => (
                <Section
                  key={section.key}
                  title={section.title}
                  action={
                    <Status
                      value={String(
                        object(health.data?.[section.key])?.level ?? "UNKNOWN",
                      )}
                    />
                  }
                >
                  <MetricRows
                    data={object(health.data?.[section.key])}
                    fields={section.fields}
                  />
                </Section>
              ))}
          </div>
        </section>
      )}
      {canSystem && (
        <Section
          title="Gửi thông báo"
          note="Số liệu trạng thái hiện tại. Hệ thống nhận thông báo push chưa xác nhận thiết bị đã hiển thị."
        >
          <QueryFeedback loading={delivery.loading} error={delivery.error} />
          <div className="grid gap-6 sm:grid-cols-2">
            {deliveryData &&
              (["email", "push"] as const).map((channel) => (
                <div key={channel}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {channel === "email" ? "Email" : "Thông báo đẩy"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {deliveryData?.[channel].enabled ? "Đã bật" : "Đang tắt"}
                    </span>
                  </div>
                  <MetricRows
                    data={
                      deliveryData[channel] as unknown as Record<
                        string,
                        unknown
                      >
                    }
                    fields={[
                      ["pending", "Đang chờ"],
                      ["processing", "Đang xử lý"],
                      ["failed24h", "Thất bại trong 24 giờ"],
                      ["retryDue", "Đến lượt gửi"],
                      ["oldestPendingAgeSec", "Chờ lâu nhất", "age"],
                    ]}
                  />
                </div>
              ))}
          </div>
        </Section>
      )}
      <Section title="Truy cập nhanh">
        <div className="flex flex-wrap gap-3">
          {[
            ["/properties/pending", "Duyệt tin đăng"],
            ["/users/kyc", "Xác minh danh tính"],
            ["/operations/complaints", "Xử lý khiếu nại"],
            ["/analytics/statistics", "Thống kê"],
            ["/blockchain", "Blockchain"],
          ]
            .filter(([href]) => canAccess(href))
            .map(([href, text]) => (
              <Link
                key={href}
                to={href}
                className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                {label(text)}
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
        </div>
      </Section>
    </div>
  );
}
