import React, { useState } from "react";
import {
  User,
  Shield,
  Lock,
  Paintbrush,
  Bell,
} from "lucide-react";
import ProfileSection from "./sections/ProfileSection";
import AppearanceSection from "./sections/AppearanceSection";
import AccountSecuritySection from "./sections/AccountSecuritySection";
import PrivacySection from "./sections/PrivacySection";
import NotificationsSection from "./sections/NotificationsSection";

export type SettingsTabId =
  | "profile"
  | "appearance"
  | "account-security"
  | "privacy"
  | "notifications";

interface SettingsContentProps {
  initialTab?: SettingsTabId;
}

export default function SettingsContent({
  initialTab = "profile",
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  const menuItems: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Thông tin cá nhân", icon: User },
    { id: "appearance", label: "Giao diện", icon: Paintbrush },
    { id: "account-security", label: "Tài khoản và bảo mật", icon: Shield },
    { id: "privacy", label: "Quyền riêng tư", icon: Lock },
    { id: "notifications", label: "Thông báo", icon: Bell },
  ];

  return (
    <div className="flex flex-col md:flex-row w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xs">
      {/* Left Column: Settings Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 bg-muted/20 border-r border-border p-4 flex flex-col shrink-0 select-none">
        <div className="px-3 py-2 mb-2">
          <h2 className="font-heading font-extrabold text-lg text-foreground tracking-tight">
            Cài đặt
          </h2>
          <p className="text-xs text-muted-foreground">Tùy chỉnh hệ thống & cá nhân</p>
        </div>

        <nav className="space-y-1 overflow-y-auto no-scrollbar flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none text-left ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="truncate flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right Column: Active Tab Content Panel */}
      <main className="flex-1 bg-card p-5 sm:p-7 md:p-8 overflow-y-auto min-h-[520px]">
        {/* 1. Thông tin cá nhân */}
        {activeTab === "profile" && <ProfileSection />}

        {/* 2. Giao diện */}
        {activeTab === "appearance" && <AppearanceSection />}

        {/* 3. Tài khoản và bảo mật */}
        {activeTab === "account-security" && <AccountSecuritySection />}

        {/* 4. Quyền riêng tư */}
        {activeTab === "privacy" && <PrivacySection />}

        {/* 5. Thông báo */}
        {activeTab === "notifications" && <NotificationsSection />}
      </main>
    </div>
  );
}
