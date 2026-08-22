import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center h-8 w-14 rounded-full bg-slate-200 dark:bg-slate-700 p-1 transition-colors duration-300 focus:outline-none cursor-pointer shadow-inner"
      title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
    >
      <div
        className={`flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-slate-900 shadow-md transform transition-transform duration-300 ${
          isDark ? "translate-x-6 text-cyan-400" : "translate-x-0 text-amber-500"
        }`}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </div>
    </button>
  );
}
