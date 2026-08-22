import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header Bar */}
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-50/50 dark:bg-background overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
