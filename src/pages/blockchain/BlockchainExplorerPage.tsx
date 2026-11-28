import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, FileCheck2, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/config/permissions";
import { useHasPermission } from "@/hooks/usePermission";
import {
  Empty,
  MetricCard,
  PageHeading,
  QueryFeedback,
  Section,
  Status,
  controlClass,
} from "@/components/dashboard/DashboardParts";
import { age, count, dateTime, label, money } from "@/lib/dashboard-report";
import { useDashboardData } from "@/hooks/useDashboardData";
import ReportDialog from "@/components/dashboard/ReportDialog";
import { explorerLink } from "@/lib/dashboard-report";
import {
  checkProof,
  getDashboardPage,
  type BlockchainSummary,
  type EthPayment,
  type Integrity,
  type Proof,
  type ProofDetail,
  type Verification,
} from "@/services/admin-dashboard.service";
import { getApiErrorMessage } from "@/utils/userUtils";

const loadProofs = getDashboardPage<Proof>;
const loadPayments = getDashboardPage<EthPayment>;
function TransactionLink({
  hash,
  chainId,
}: {
  hash: string | null;
  chainId: number;
}) {
  const href = explorerLink(chainId, hash);
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
      aria-label={`Xem giao dịch ${hash} trên Etherscan`}
    >
      {hash?.slice(0, 10)}…{hash?.slice(-6)}
      <ExternalLink className="size-3.5" />
    </a>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}
function Pagination({
  page,
  totalPages,
  total,
  loading,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <span className="text-xs text-muted-foreground">
        {count(total)} bản ghi · Trang {page} / {Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={loading || page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-10 rounded-xl"
        >
          Trước
        </Button>
        <Button
          variant="outline"
          disabled={loading || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="h-10 rounded-xl"
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
export default function BlockchainExplorerPage() {
  const canIntegrity = useHasPermission(PERMISSIONS.CONTRACT_VIEW);
  const [tab, setTab] = useState<"proofs" | "payments">("proofs");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [unsettled, setUnsettled] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [check, setCheck] = useState<{
    id: string;
    result?: Verification | Integrity;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const summary = useDashboardData<BlockchainSummary>(
    "/api/v1/admin/blockchain/summary",
  );
  const proofs = useDashboardData(
    `/api/v1/admin/blockchain/proofs?${query ? `${query}&` : ""}page=${page}&size=20`,
    loadProofs,
  );
  const payments = useDashboardData(
    tab === "payments"
      ? `/api/v1/admin/blockchain/membership-eth-payments?unsettled=${unsettled}&page=${paymentPage}&size=20`
      : null,
    loadPayments,
  );
  const detail = useDashboardData<ProofDetail>(
    selected
      ? `/api/v1/admin/blockchain/proofs/${encodeURIComponent(selected)}`
      : null,
  );
  const hasOpenProofs =
    Number(summary.data?.counts.PENDING ?? 0) +
      Number(summary.data?.counts.SUBMITTED ?? 0) >
    0;
  const refreshSummary = summary.refresh;
  const refreshCurrentPage = tab === "proofs" ? proofs.refresh : payments.refresh;
  useEffect(() => {
    if (!hasOpenProofs && tab !== "payments") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshSummary();
      refreshCurrentPage();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [hasOpenProofs, tab, refreshSummary, refreshCurrentPage]);
  function filterStatus(status: string) {
    const params = new URLSearchParams(query);
    params.set("status", status);
    setStatusFilter(status);
    setQuery(params.toString());
    setPage(1);
    setTab("proofs");
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const prefix = String(form.get("contractNumber") ?? "").trim();
    const status = String(form.get("status") ?? "");
    const from = String(form.get("from") ?? ""),
      to = String(form.get("to") ?? "");
    if (from && to && from > to) {
      setFilterError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    setFilterError("");
    if (prefix) params.set("contractNumber", prefix);
    if (status) params.set("status", status);
    if (from)
      params.set("from", new Date(`${from}T00:00:00+07:00`).toISOString());
    if (to)
      params.set(
        "to",
        new Date(Date.parse(`${to}T00:00:00+07:00`) + 86400000).toISOString(),
      );
    setQuery(params.toString());
    setPage(1);
  }
  async function runCheck(action: "verify" | "integrity") {
    if (!selected || busy) return;
    const id = selected;
    setBusy(id);
    setCheck(null);
    try {
      const result = await checkProof(id, action);
      setCheck({ id, result });
      summary.refresh();
    } catch (cause) {
      setCheck({
        id,
        error: getApiErrorMessage(
          cause,
          "Không thực hiện được kiểm tra. Vui lòng thử lại sau.",
        ),
      });
    } finally {
      setBusy(null);
    }
  }
  function refresh() {
    summary.refresh();
    proofs.refresh();
    payments.refresh();
  }
  const data = summary.data;
  const currentCheck = check?.id === selected ? check : null;
  return (
    <div className="space-y-6 pb-8">
      <PageHeading
        title="Đối soát blockchain"
        subtitle="Theo dõi bằng chứng hợp đồng và thanh toán hội viên bằng ETH."
        generatedAt={data?.asOf}
        loading={summary.loading}
        onRefresh={refresh}
      />
      <QueryFeedback loading={summary.loading} error={summary.error} />
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <span className="font-semibold">{data.network.name}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs">
              {data.network.enabled ? "Bằng chứng hợp đồng đã bật" : "Bằng chứng hợp đồng đang tắt"}
            </span>
            {data.network.registryAddress && (
              <span className="min-w-0 break-all font-mono text-xs text-muted-foreground">
                Registry {data.network.registryAddress}
              </span>
            )}
          </div>
          <section aria-labelledby="eth-payment-summary" className="space-y-3">
            <h2 id="eth-payment-summary" className="text-base font-semibold">Thanh toán hội viên bằng ETH</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Tổng giao dịch ETH" value={count(data.ethTotal)} />
              <MetricCard label="ETH đã thanh toán" value={count(data.ethPaid)} />
              <MetricCard label="ETH chờ đối soát" value={count(data.ethUnsettled)} />
            </div>
          </section>
          <h2 className="text-base font-semibold">Bằng chứng hợp đồng</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {["PENDING", "SUBMITTED", "CONFIRMED", "FAILED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => filterStatus(status)}
                className={`rounded-2xl text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring ${status === "FAILED" && Number(data.counts[status]) > 0 ? "text-destructive ring-1 ring-destructive/30" : ""}`}
                aria-label={`Lọc bằng chứng: ${label(status)}`}
                aria-pressed={statusFilter === status && tab === "proofs"}
              >
                <MetricCard
                  label={label(status)}
                  value={count(data.counts[status])}
                />
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Chờ quá 15 phút"
              value={count(data.stuck)}
              note={`Hồ sơ mở lâu nhất ${age(data.oldestOpenAgeSeconds)}`}
            />
            <MetricCard
              label="Sự cố đang mở"
              value={count(data.openIncidents)}
            />
          </div>
        </>
      )}
      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Dữ liệu blockchain"
      >
        {(
          [
            ["proofs", "Bằng chứng hợp đồng"],
            ["payments", "Thanh toán ETH"],
          ] as const
        ).map(([key, title]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {title}
          </button>
        ))}
      </div>
      {tab === "proofs" ? (
        <Section title="Bằng chứng hợp đồng">
          <form onSubmit={filter} className="mb-5 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-xs font-medium">
                Mã hợp đồng
                <input
                  name="contractNumber"
                  maxLength={64}
                  placeholder="Tìm theo phần đầu mã"
                  className={`${controlClass} w-48`}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                Trạng thái
                <select
                  name="status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={controlClass}
                >
                  <option value="">Tất cả</option>
                  {["PENDING", "SUBMITTED", "CONFIRMED", "FAILED"].map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                Từ ngày
                <input type="date" name="from" className={controlClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                Đến ngày
                <input type="date" name="to" className={controlClass} />
              </label>
              <Button type="submit" className="h-11 rounded-xl px-4">
                <Search className="size-4" />
                Lọc
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ngày tạo bằng chứng theo giờ Việt Nam.
            </p>
            {filterError && (
              <p role="alert" className="text-sm text-destructive">
                {filterError}
              </p>
            )}
          </form>
          <QueryFeedback loading={proofs.loading} error={proofs.error} />
          {proofs.data && (
            <>
              {proofs.data.result.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        {[
                          "Hợp đồng",
                          "Trạng thái",
                          "Giao dịch",
                          "Ngày tạo",
                          "",
                        ].map((text, i) => (
                          <th key={i} className="px-3 pb-3 font-medium">
                            {text}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proofs.data.result.map((row) => (
                        <tr
                          key={row.documentId}
                          className="border-t border-border"
                        >
                          <td className="p-3 font-medium">
                            {row.contractNumber}
                          </td>
                          <td className="p-3">
                            <Status value={row.status} />
                          </td>
                          <td className="p-3">
                            <TransactionLink
                              hash={row.transactionHash}
                              chainId={data?.network.chainId ?? 0}
                            />
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {dateTime(row.createdAt)}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelected(row.documentId);
                                setCheck(null);
                              }}
                              className="h-10 rounded-xl"
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Chưa có bằng chứng khớp bộ lọc.</Empty>
              )}
              <Pagination
                page={page}
                totalPages={proofs.data.totalPages}
                total={proofs.data.totalElements}
                loading={proofs.loading}
                onPage={setPage}
              />
            </>
          )}
        </Section>
      ) : (
        <Section
          title="Thanh toán hội viên bằng ETH"
          note="Mạng Sepolia là cấu hình hiện tại. Có mã giao dịch chưa đồng nghĩa thanh toán đã hoàn tất."
        >
          <label className="mb-5 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={unsettled}
              onChange={(event) => {
                setUnsettled(event.target.checked);
                setPaymentPage(1);
              }}
              className="size-4 accent-primary"
            />
            Chỉ khoản chưa được ghi nhận đã thanh toán
          </label>
          <QueryFeedback loading={payments.loading} error={payments.error} />
          {payments.data && (
            <>
              {payments.data.result.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        {[
                          "Đơn / gói",
                          "Giá trị VND",
                          "ETH theo wei",
                          "Trạng thái",
                          "Giao dịch",
                          "Tạo đơn lúc",
                          "Xác nhận lúc",
                        ].map((text) => (
                          <th key={text} className="px-3 pb-3 font-medium">
                            {text}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.data.result.map((row, i) => (
                        <tr
                          key={`${row.orderId}-${i}`}
                          className="border-t border-border"
                        >
                          <td className="p-3">
                            <p className="font-medium">
                              {row.kind === "ADDON" ? "Mua thêm lượt đăng tin" : row.tier ? `Gói ${row.tier}` : label(row.kind)}
                            </p>
                            <p
                              className="mt-1 max-w-40 truncate font-mono text-xs text-muted-foreground"
                              title={row.orderId}
                            >
                              {row.orderId}
                            </p>
                          </td>
                          <td className="p-3 tabular-nums">
                            {money(row.amountVnd)}
                          </td>
                          <td className="max-w-52 break-all p-3 font-mono text-xs">
                            {row.amountWei}
                          </td>
                          <td className="p-3">
                            <Status value={row.status} />
                          </td>
                          <td className="p-3">
                            <TransactionLink
                              hash={row.transactionHash}
                              chainId={row.chainId}
                            />
                          </td>
                          <td className="p-3 text-xs">{dateTime(row.orderCreatedAt)}</td>
                          <td className="p-3 text-xs">{dateTime(row.confirmedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>{unsettled ? "Không có giao dịch ETH chờ đối soát. Bỏ chọn bộ lọc để xem cả giao dịch đã thanh toán." : "Chưa ghi nhận giao dịch thanh toán ETH."}</Empty>
              )}
              <Pagination
                page={paymentPage}
                totalPages={payments.data.totalPages}
                total={payments.data.totalElements}
                loading={payments.loading}
                onPage={setPaymentPage}
              />
            </>
          )}
        </Section>
      )}
      {data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section
            title="Toàn vẹn tài liệu"
            note="Phản ánh lần kiểm tra gần nhất, kết quả có thể đã cũ."
          >
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(data.integrity.counts).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                >
                  <dt>{label(key)}</dt>
                  <dd className="font-semibold tabular-nums">{count(value)}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section title="Mã lỗi hiện tại">
            {Object.keys(data.byErrorCode).length ? (
              <dl className="space-y-3">
                {Object.entries(data.byErrorCode).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 text-sm">
                    <dt className="break-all text-muted-foreground">
                      {label(key)}
                    </dt>
                    <dd className="font-semibold">{count(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Empty>Chưa có mã lỗi được ghi nhận.</Empty>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Lịch sử lần chạy worker chưa có nguồn đo đầy đủ.
            </p>
          </Section>
        </div>
      )}
      <ReportDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Chi tiết bằng chứng"
        description={detail.data?.contractNumber ?? "Đang tải hồ sơ"}
      >
        <QueryFeedback loading={detail.loading} error={detail.error} />
        {detail.data && (
          <div className="space-y-5">
            <Status value={detail.data.status} />
            <dl className="space-y-3 text-sm">
              {[
                ["Mã tài liệu", detail.data.documentId],
                ["Ngày tạo", dateTime(detail.data.createdAt)],
                ["Ngày xác nhận", dateTime(detail.data.confirmedAt)],
                ["Hash tài liệu", detail.data.documentHash],
                ["Mã tệp trên chuỗi", detail.data.onChainDocumentId],
                ["Block", count(detail.data.blockNumber)],
                ["Lần thử", count(detail.data.attempts)],
                ["Mã lỗi", detail.data.errorCode],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="grid gap-1 border-b border-border pb-3 sm:grid-cols-[160px_1fr]"
                >
                  <dt className="text-muted-foreground">{title}</dt>
                  <dd className="break-all text-xs leading-5">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <TransactionLink
              hash={detail.data.transactionHash}
              chainId={detail.data.chainId}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={Boolean(busy)}
                variant="outline"
                onClick={() => void runCheck("verify")}
                className="h-11 rounded-xl"
              >
                <ShieldCheck className="size-4" />
                Đối chiếu on-chain
              </Button>
              {canIntegrity && (
                <Button
                  disabled={Boolean(busy)}
                  onClick={() => void runCheck("integrity")}
                  className="h-11 rounded-xl"
                >
                  <FileCheck2 className="size-4" />
                  Kiểm tra tệp đã lưu
                </Button>
              )}
            </div>
            {busy && (
              <p role="status" className="text-sm text-muted-foreground">
                Đang kiểm tra…
              </p>
            )}
            {currentCheck?.error && (
              <p role="alert" className="text-sm text-destructive">
                {currentCheck.error}
              </p>
            )}
            {currentCheck?.result && (
              <div
                role="status"
                className="rounded-xl border border-border bg-muted/40 p-4 text-sm"
              >
                <Status value={currentCheck.result.status} />
                {"matches" in currentCheck.result ? (
                  <p className="mt-3">
                    {currentCheck.result.status === "UNAVAILABLE"
                      ? "Chưa thể đối chiếu với mạng blockchain."
                      : currentCheck.result.matches
                        ? "Hash tài liệu khớp bằng chứng trên chuỗi."
                        : currentCheck.result.conflict
                          ? "Hash tài liệu khác bằng chứng trên chuỗi. Cần kiểm tra hồ sơ."
                          : "Chưa tìm thấy bằng chứng trên chuỗi."}
                  </p>
                ) : (
                  <p className="mt-3">
                    {currentCheck.result.message ??
                      label(currentCheck.result.status)}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tối đa 10 lượt kiểm tra mỗi phút cho một quản trị viên trên
              instance.
            </p>
          </div>
        )}
      </ReportDialog>
    </div>
  );
}
