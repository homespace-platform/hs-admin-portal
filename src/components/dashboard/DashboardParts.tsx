import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MetricObject } from "@/services/admin-dashboard.service";
import { age, count, dateTime, label, money } from "@/lib/dashboard-report";

export const panelClass = "rounded-2xl border border-border bg-card p-5 sm:p-6";
export const controlClass =
  "h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
export function PageHeading({
  title,
  subtitle,
  generatedAt,
  loading,
  onRefresh,
  children,
}: {
  title: string;
  subtitle: string;
  generatedAt?: string;
  loading?: boolean;
  onRefresh: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {generatedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Cập nhật {dateTime(generatedAt)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="h-11 rounded-xl px-4"
        >
          <RefreshCw
            className={loading ? "size-4 animate-spin" : "size-4"}
            aria-hidden
          />
          Tải lại
        </Button>
      </div>
    </header>
  );
}
export function QueryFeedback({
  loading,
  error,
  degraded,
}: {
  loading?: boolean;
  error?: string;
  degraded?: string[];
}) {
  return (
    <>
      {loading && (
        <div role="status" className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
          <span className="sr-only">Đang tải dữ liệu</span>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <ShieldAlert className="size-4 shrink-0" />
          {error}
        </p>
      )}
      {!!degraded?.length && (
        <p
          role="status"
          className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
        >
          Một số nguồn dữ liệu tạm thời chưa khả dụng. Các phần đã tải vẫn được
          hiển thị.
        </p>
      )}
    </>
  );
}
export function MetricCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {href && (
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        )}
      </div>
      <p className="mt-3 break-words text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {note && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
      )}
    </>
  );
  return href ? (
    <Link
      to={href}
      className={`${panelClass} transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring`}
    >
      {content}
    </Link>
  ) : (
    <div className={panelClass}>{content}</div>
  );
}
export function Section({
  title,
  children,
  note,
  action,
}: {
  title: string;
  children: ReactNode;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <section className={panelClass}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {note && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {note}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  children = "Chưa có dữ liệu trong khoảng đã chọn.",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="flex min-h-24 items-center justify-center gap-2 rounded-xl bg-muted/30 p-5 text-center text-sm text-muted-foreground">
      <Activity className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
export function MetricRows({
  data,
  fields,
}: {
  data: MetricObject | null | undefined;
  fields: [string, string, ("money" | "age")?][];
}) {
  if (!data)
    return <Empty>Chưa có dữ liệu hoặc bạn chưa được cấp quyền xem.</Empty>;
  return (
    <dl className="divide-y divide-border">
      {fields.map(([key, label, format]) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-right text-sm font-semibold tabular-nums">
            {format === "money"
              ? money(data[key])
              : format === "age"
                ? age(data[key])
                : count(data[key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function Status({ value }: { value: string | null | undefined }) {
  const good = [
    "OK",
    "UP",
    "CONFIRMED",
    "MATCH",
    "VERIFIED",
    "PAID",
    "AVAILABLE",
  ].includes(value ?? "");
  const bad = ["ERROR", "DOWN", "FAILED", "MISMATCH", "REJECTED"].includes(
    value ?? "",
  );
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${good ? "bg-verified/10 text-foreground" : bad ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
    >
      <span
        className={`size-1.5 rounded-full ${good ? "bg-verified" : bad ? "bg-destructive" : "bg-muted-foreground"}`}
        aria-hidden
      />
      {label(value ?? "UNKNOWN")}
    </span>
  );
}
