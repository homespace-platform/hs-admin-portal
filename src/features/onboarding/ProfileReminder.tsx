import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import userService from "@/services/user.service";
import { useAppSelector } from "@/store/hooks";

// Non-blocking notice: shown only while the profile is incomplete. The status is refetched whenever
// the profile in the store changes (e.g. after the admin saves it in settings), so it clears itself.
export default function ProfileReminder() {
  const userId = useAppSelector((state) => state.auth.userId);
  const profile = useAppSelector((state) => state.user.profile);
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    if (!userId || !profile || profile.id !== userId) return;
    let active = true;
    userService.getOnboardingStatus()
      .then((status) => {
        if (active) setMissingProfile(status.missingRequirements?.includes("PROFILE") ?? false);
      })
      .catch(() => {
        // Reminder is advisory; ignore status failures.
      });
    return () => {
      active = false;
    };
  }, [userId, profile]);

  if (!missingProfile) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:flex-row sm:items-center sm:gap-3 sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
    >
      <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 leading-5">
        Bổ sung thông tin cá nhân (họ tên, số điện thoại…) để phục vụ truy vết thao tác quản trị.
      </p>
      <Link
        to="/settings/profile"
        className="shrink-0 font-bold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100"
      >
        Cập nhật ngay
      </Link>
    </div>
  );
}
