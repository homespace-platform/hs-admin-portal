import { Users, UserCheck, UserX, ShieldCheck } from "lucide-react";

interface UserStatsCardsProps {
  totalElements: number;
  activeCount: number;
  inactiveCount: number;
  onboardedCount: number;
}

export default function UserStatsCards({
  totalElements,
  activeCount,
  inactiveCount,
  onboardedCount,
}: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tổng người dùng
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">
            {totalElements}
          </p>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Đang hoạt động
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">
            {activeCount}
          </p>
        </div>
      </div>

      {/* Inactive Users */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <UserX className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Đã vô hiệu hóa
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Onboarding Completed */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Đã Onboarding
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">
            {onboardedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
