import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, ScrollText, X, type LucideIcon } from "lucide-react";

interface PolicyDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional version pill, e.g. "v1.2". */
  version?: string;
  icon?: LucideIcon;
  /** Rich body. Takes precedence over `text`. */
  children?: ReactNode;
  /** Plain text: split into a numbered list on ". " (every character kept); one sentence renders as a paragraph. */
  text?: string;
  /** Custom footer; defaults to a primary "Đã hiểu" button. */
  footer?: ReactNode;
}

function TextBody({ text }: { text: string }) {
  const parts = text.split(/(?<=\.) /).filter(Boolean);
  if (parts.length <= 1) return <p className="leading-relaxed">{text}</p>;
  return (
    <ol className="list-decimal space-y-2.5 pl-5 leading-relaxed marker:font-semibold marker:text-primary">
      {parts.map((p, i) => <li key={i}>{p}</li>)}
    </ol>
  );
}

export function PolicyDialog({ open, onClose, title, subtitle, version, icon: Icon = ScrollText, children, text, footer }: PolicyDialogProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const target = okRef.current ?? rootRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea");
    target?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const all = document.querySelectorAll('[aria-modal="true"]');
      if (all[all.length - 1] !== rootRef.current) return; // only the topmost dialog closes
      e.stopPropagation();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={rootRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={titleId} className="text-base font-bold">{title}</h2>
              {version && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{version}</span>}
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 text-sm text-foreground">
          {children ?? (text ? <TextBody text={text} /> : null)}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          {footer ?? <button ref={okRef} type="button" onClick={onClose} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Đã hiểu</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const TONES = {
  info: { row: "border-blue-100 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30", tile: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200", Icon: Info },
  warning: { row: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30", tile: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200", Icon: AlertTriangle },
  neutral: { row: "border-border bg-muted/40", tile: "bg-muted text-muted-foreground", Icon: Info },
} as const;

interface PolicyNoticeProps extends Pick<PolicyDialogProps, "title" | "subtitle" | "version" | "children" | "text" | "footer"> {
  /** One-line summary always visible. */
  summary: ReactNode;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  dialogIcon?: LucideIcon;
  actionLabel?: string;
  className?: string;
}

export function PolicyNotice({ summary, tone = "info", icon, dialogIcon, actionLabel = "Xem chi tiết", className = "", ...dialog }: PolicyNoticeProps) {
  const [open, setOpen] = useState(false);
  const t = TONES[tone];
  const Icon = icon ?? t.Icon;
  return (
    <>
      <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs sm:text-sm ${t.row} ${className}`}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.tile}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
        <p className="min-w-0 flex-1 truncate font-semibold" title={typeof summary === "string" ? summary : undefined}>{summary}</p>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{actionLabel}</button>
      </div>
      <PolicyDialog open={open} onClose={() => setOpen(false)} icon={dialogIcon ?? icon} {...dialog} />
    </>
  );
}

export default PolicyDialog;
