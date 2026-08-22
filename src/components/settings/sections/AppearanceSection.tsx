import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("Tiếng Việt");

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in-50 duration-200">
      {/* 1. Cài đặt chủ đề giao diện (Visual Theme Selector) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Chủ đề giao diện</h3>
        <p className="text-xs text-muted-foreground">
          Chọn giao diện hiển thị phù hợp với môi trường làm việc của bạn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Theme Sáng */}
          <div
            onClick={() => setTheme("light")}
            className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200 bg-card select-none ${
              theme === "light"
                ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
            }`}
          >
            <div className="w-full aspect-16/10 rounded-xl bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between shadow-2xs overflow-hidden">
              <div className="w-4 h-2 rounded bg-blue-400" />
              <div className="w-12 h-3 rounded bg-white border border-slate-200" />
              <div className="w-8 h-3 rounded bg-blue-500 self-end" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mt-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  theme === "light"
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/50"
                }`}
              >
                {theme === "light" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span>Sáng</span>
            </div>
          </div>

          {/* Theme Tối */}
          <div
            onClick={() => setTheme("dark")}
            className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200 bg-card select-none ${
              theme === "dark"
                ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
            }`}
          >
            <div className="w-full aspect-16/10 rounded-xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between shadow-2xs overflow-hidden">
              <div className="w-4 h-2 rounded bg-blue-500" />
              <div className="w-12 h-3 rounded bg-slate-800 border border-slate-700" />
              <div className="w-8 h-3 rounded bg-blue-600 self-end" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mt-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  theme === "dark"
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/50"
                }`}
              >
                {theme === "dark" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span>Tối</span>
            </div>
          </div>

          {/* Theme Hệ Thống */}
          <div
            onClick={() => setTheme("system")}
            className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200 bg-card select-none ${
              theme === "system"
                ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
            }`}
          >
            <div className="w-full aspect-16/10 rounded-xl bg-linear-to-r from-slate-100 to-slate-900 border border-slate-300 p-2 flex flex-col justify-between shadow-2xs overflow-hidden">
              <div className="w-4 h-2 rounded bg-blue-400" />
              <div className="w-12 h-3 rounded bg-white/70" />
              <div className="w-8 h-3 rounded bg-blue-500 self-end" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mt-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  theme === "system"
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/50"
                }`}
              >
                {theme === "system" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span>Hệ thống</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ngôn ngữ hiển thị */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">Ngôn ngữ hiển thị</h3>
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-foreground">Ngôn ngữ giao diện</p>
            <p className="text-[11px] text-muted-foreground">Chọn ngôn ngữ bạn muốn sử dụng trên bảng quản trị</p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 bg-muted/50 rounded-xl border border-border text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
