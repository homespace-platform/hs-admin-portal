import { NavLink, Outlet, useParams, Navigate } from "react-router-dom";
import {
  SETTINGS_SECTIONS,
  isSettingsSectionId,
  type SettingsSectionId,
} from "./settings-nav";
import ProfileSection from "./sections/ProfileSection";
import AppearanceSection from "./sections/AppearanceSection";
import AccountSecuritySection from "./sections/AccountSecuritySection";
import PrivacySection from "./sections/PrivacySection";
import NotificationsSection from "./sections/NotificationsSection";
import MessagesSection from "./sections/MessagesSection";

function SectionBody({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case "appearance":
      return <AppearanceSection />;
    case "account-security":
      return <AccountSecuritySection />;
    case "privacy":
      return <PrivacySection />;
    case "notifications":
      return <NotificationsSection />;
    case "messages":
      return <MessagesSection />;
    case "profile":
    default:
      return <ProfileSection />;
  }
}

export function SettingsShell() {
  return (
    <div className="flex flex-col md:flex-row w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xs">
      <aside className="w-full md:w-64 lg:w-72 bg-muted/20 border-r border-border p-4 flex flex-col shrink-0 select-none">
        <div className="px-3 py-2 mb-2">
          <h2 className="font-heading font-extrabold text-lg text-foreground tracking-tight">
            Cài đặt
          </h2>
        </div>

        <nav className="space-y-1 overflow-y-auto no-scrollbar flex-1">
          {SETTINGS_SECTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={`/settings/${item.id}`}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none text-left ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-card p-5 sm:p-7 md:p-8 overflow-y-auto min-h-[520px]">
        <Outlet />
      </main>
    </div>
  );
}

export function SettingsSectionPage() {
  const { section } = useParams<{ section: string }>();
  if (!section || !isSettingsSectionId(section)) {
    return <Navigate to="/settings/profile" replace />;
  }
  return <SectionBody section={section} />;
}

/** @deprecated Prefer /settings/[section] routes */
export type SettingsTabId = SettingsSectionId;

export default function SettingsContent({
  initialTab = "profile",
}: {
  initialTab?: SettingsSectionId;
}) {
  return <SectionBody section={initialTab} />;
}
