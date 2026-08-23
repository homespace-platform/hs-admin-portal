import { KeyRound, ShieldCheck, Users, FileText } from "lucide-react";

interface PermissionStatsCardsProps {
  totalElements: number;
  userScopeCount: number;
  roleScopeCount: number;
  otherCount: number;
}

export default function PermissionStatsCards({
  totalElements,
  userScopeCount,
  roleScopeCount,
  otherCount,
}: PermissionStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tổng quyền hạn
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalElements}</p>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nhóm User
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">{userScopeCount}</p>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nhóm Role
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">{roleScopeCount}</p>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex items-center gap-4 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nhóm khác
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-0.5">{otherCount}</p>
        </div>
      </div>
    </div>
  );
}
