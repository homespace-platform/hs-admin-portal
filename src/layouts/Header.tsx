import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import AdminQueueBell from "./AdminQueueBell";
import PersonalNotificationBell from "./PersonalNotificationBell";

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Header({ collapsed, onToggleCollapse }: HeaderProps) {
  return (
    <header className="h-20 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors select-none shadow-2xs">
      {/* 1. Left: Toggle Sidebar + Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-primary" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Search Bar */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/60 hover:bg-muted rounded-full border border-border focus:outline-none focus:border-primary text-foreground transition-all"
          />
        </div>
      </div>

      {/* 2. Right Actions: Notification + User Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Pending-review queue bell (shared poller from AdminQueueProvider) */}
        <AdminQueueBell />
        <PersonalNotificationBell />

        {/* User Dropdown (Pill trigger + Popup Menu giống Client) */}
        <UserDropdown />
      </div>
    </header>
  );
}
