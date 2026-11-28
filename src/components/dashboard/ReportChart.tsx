import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty } from "@/components/dashboard/DashboardParts";
import { count, money } from "@/lib/dashboard-report";

export interface ChartSeries {
  key: string;
  label: string;
  values: unknown[] | null;
}
export default function ReportChart({
  buckets,
  series,
  currency = false,
  bars = false,
}: {
  buckets: string[];
  series: ChartSeries[];
  currency?: boolean;
  bars?: boolean;
}) {
  const available = series.filter((item) => item.values !== null);
  if (!buckets.length || !available.length) return <Empty />;
  const data = buckets.map((bucket, i) =>
    Object.fromEntries([
      ["bucket", bucket],
      ...available.flatMap((item) => {
        const raw = item.values?.[i];
        const numeric = Number(raw);
        return [
          [item.key, raw == null || !Number.isFinite(numeric) ? null : numeric],
          [`${item.key}Raw`, raw],
        ];
      }),
    ]),
  );
  const axis = (
    <>
      <CartesianGrid
        stroke="var(--border)"
        strokeDasharray="3 3"
        vertical={false}
      />
      <XAxis
        dataKey="bucket"
        tickLine={false}
        axisLine={false}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        minTickGap={30}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        tickFormatter={(value) =>
          new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(value)
        }
        width={55}
      />
      <Tooltip
        contentStyle={{
          background: "var(--popover)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
        formatter={(value, _name, item) => {
          const raw = item.payload?.[`${String(item.dataKey)}Raw`] ?? value;
          return currency ? money(raw) : count(raw);
        }}
      />
      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
    </>
  );
  return (
    <div
      className="h-72 min-w-0"
      role="img"
      aria-label={available.map((item) => item.label).join(", ")}
    >
      <ResponsiveContainer width="100%" height="100%">
        {bars ? (
          <BarChart
            data={data}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          >
            {axis}
            {available.map((item, i) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={`var(--chart-${(i % 5) + 1})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart
            data={data}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          >
            {axis}
            {available.map((item, i) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={`var(--chart-${(i % 5) + 1})`}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
