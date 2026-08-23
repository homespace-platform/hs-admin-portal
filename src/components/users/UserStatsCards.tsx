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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Left: Heading & Description */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Người dùng hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Quản lý tài khoản người dùng, phân quyền vai trò (Role & Permission) và kiểm soát trạng thái hoạt động trên toàn hệ thống HomeSpace.
        </p>
      </div>

      {/* Right: Compact Minimalist Stats (No bulky icons, clean & focused) */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap lg:justify-end shrink-0">
        {/* Total Users */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground">Tổng:</span>
          <span className="text-sm sm:text-base font-extrabold text-foreground font-mono">
            {totalElements}
          </span>
        </div>

        {/* Active Users */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Hoạt động:
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {activeCount}
          </span>
        </div>

        {/* Inactive Users */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            Đã khóa:
          </span>
          <span className="text-sm sm:text-base font-extrabold text-destructive font-mono">
            {inactiveCount}
          </span>
        </div>

        {/* Onboarding Completed */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground">Onboarding:</span>
          <span className="text-sm sm:text-base font-extrabold text-primary font-mono">
            {onboardedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
