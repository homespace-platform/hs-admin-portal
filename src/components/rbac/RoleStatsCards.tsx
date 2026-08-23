interface RoleStatsCardsProps {
  totalElements: number;
  adminCount: number;
  userCount: number;
  withPermissionsCount: number;
}

export default function RoleStatsCards({
  totalElements,
  adminCount,
  userCount,
  withPermissionsCount,
}: RoleStatsCardsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Left: Heading & Description */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Vai trò hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Quản lý danh sách vai trò (Roles), cấu hình chính sách bảo mật và gán quyền hạn truy cập (Permissions) cho từng nhóm tài khoản.
        </p>
      </div>

      {/* Right: Compact Minimalist Stats (No bulky icons, clean typography) */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap lg:justify-end shrink-0">
        {/* Total Roles */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground">Tổng vai trò:</span>
          <span className="text-sm sm:text-base font-extrabold text-foreground font-mono">
            {totalElements}
          </span>
        </div>

        {/* Admin Role */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            Admin:
          </span>
          <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {adminCount}
          </span>
        </div>

        {/* User Role */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            User:
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {userCount}
          </span>
        </div>

        {/* Roles with assigned permissions */}
        <div className="bg-card px-3 py-1.5 rounded-xl border border-border flex items-baseline gap-2 shadow-2xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Có quyền gán:
          </span>
          <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {withPermissionsCount}
          </span>
        </div>
      </div>
    </div>
  );
}
