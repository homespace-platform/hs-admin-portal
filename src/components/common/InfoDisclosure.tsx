import { useId, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Info, type LucideIcon } from "lucide-react";

const TONES = {
  info: "border-blue-100 bg-blue-50/80 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
} as const;

interface InfoDisclosureProps {
  /** One-line message that is always visible. */
  summary: ReactNode;
  /** Full text, shown only after "Xem chi tiết". */
  children: ReactNode;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  className?: string;
}

export default function InfoDisclosure({ summary, children, tone = "info", icon, className = "" }: InfoDisclosureProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const Icon = icon ?? (tone === "warning" ? AlertTriangle : Info);
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs sm:text-sm ${TONES[tone]} ${className}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 font-semibold">{summary}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {open ? "Thu gọn" : "Xem chi tiết"}
          <ChevronDown className={`h-3.5 w-3.5 motion-safe:transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <div id={panelId} hidden={!open} className="mt-2 space-y-1 pl-[1.625rem] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
