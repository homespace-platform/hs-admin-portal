import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useParams, Navigate } from "react-router-dom";
import { X, type LucideIcon } from "lucide-react";
import {
  SETTINGS_SECTIONS,
  isSettingsSectionId,
  type SettingsSectionId,
} from "./settings-nav";
import ProfileSection from "./sections/ProfileSection";
import AppearanceSection from "./sections/AppearanceSection";
import AccountSecuritySection from "./sections/AccountSecuritySection";
import BankAccountsSection from "./sections/BankAccountsSection";
import NotificationsSection from "./sections/NotificationsSection";

function SectionBody({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case "appearance":
      return <AppearanceSection />;
    case "account-security":
      return <AccountSecuritySection />;
    case "bank-accounts":
      return <BankAccountsSection />;
    case "notifications":
      return <NotificationsSection />;
    case "profile":
    default:
      return <ProfileSection />;
  }
}

const navItemClass = (active: boolean) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none text-left shrink-0 md:w-full ${
    active
      ? "bg-primary/10 text-primary font-bold shadow-2xs"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
  }`;

function NavItemInner({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <>
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className="truncate flex-1 whitespace-nowrap md:whitespace-normal">{label}</span>
    </>
  );
}

interface SettingsShellProps {
  /** Controlled tab mode (modal): tabs switch in place instead of navigating. */
  activeSection?: SettingsSectionId;
  onSelect?: (section: SettingsSectionId) => void;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

export function SettingsShell({ activeSection, onSelect, onClose, children, className = "" }: SettingsShellProps) {
  const controlled = Boolean(onSelect);
  const activeLabel = SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label;

  return (
    <div className={`flex flex-col md:flex-row w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xs ${className}`}>
      <aside className="w-full md:w-64 lg:w-72 bg-muted/20 border-r border-border p-4 flex flex-col shrink-0 select-none">
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <h2 id="settings-dialog-title" className="font-heading font-extrabold text-lg text-foreground tracking-tight">
            Cài đặt
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cài đặt"
              className="md:hidden p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex md:block gap-1 md:space-y-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto no-scrollbar flex-1">
          {SETTINGS_SECTIONS.map((item) =>
            controlled ? (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
                className={navItemClass(activeSection === item.id)}
              >
                <NavItemInner icon={item.icon} label={item.label} active={activeSection === item.id} />
              </button>
            ) : (
              <NavLink key={item.id} to={`/settings/${item.id}`} className={({ isActive }) => navItemClass(isActive)}>
                {({ isActive }) => <NavItemInner icon={item.icon} label={item.label} active={isActive} />}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      <main
        className={`relative flex-1 bg-card p-5 sm:p-7 md:p-8 overflow-y-auto min-h-0 ${controlled ? "" : "min-h-[520px]"}`}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng cài đặt"
            aria-label="Đóng cài đặt"
            className="hidden md:flex absolute top-5 right-5 w-8 h-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground items-center justify-center transition-all cursor-pointer shadow-2xs z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {controlled && activeLabel && (
          <h3 className="mb-5 pr-10 font-heading text-xl font-extrabold tracking-tight text-foreground">
            {activeLabel}
          </h3>
        )}
        {controlled ? children : <Outlet />}
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
  onClose,
}: {
  initialTab?: SettingsSectionId;
  onClose?: () => void;
}) {
  const [section, setSection] = useState<SettingsSectionId>(initialTab);
  return (
    <SettingsShell
      activeSection={section}
      onSelect={setSection}
      onClose={onClose}
      className="h-full rounded-none border-0 sm:rounded-3xl sm:border shadow-2xl"
    >
      <SectionBody section={section} />
    </SettingsShell>
  );
}
