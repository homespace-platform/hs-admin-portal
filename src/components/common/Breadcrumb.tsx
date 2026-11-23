import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  const last = items.length - 1;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const isFirst = i === 0;
          const isLast = i === last;
          // Mobile: with long trails keep only first and last.
          const hideOnMobile = items.length > 3 && !isFirst && !isLast;
          const label = (
            <span className={cn(isFirst && "sr-only sm:not-sr-only")}>{item.label}</span>
          );
          return (
            <li
              key={`${i}-${item.label}`}
              className={cn(
                "min-w-0 items-center gap-1.5",
                hideOnMobile ? "hidden sm:flex" : "flex"
              )}
            >
              {!isFirst && (
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  title={item.label}
                  className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-foreground max-w-[50vw] sm:max-w-[40ch]"
                >
                  {isFirst && <Home className="h-4 w-4 shrink-0" />}
                  {label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {isFirst && <Home className="h-4 w-4 shrink-0" />}
                  {label}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {isFirst && <Home className="h-4 w-4 shrink-0" />}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
