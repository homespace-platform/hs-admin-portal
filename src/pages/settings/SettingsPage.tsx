import { Navigate } from "react-router-dom";
import { SettingsShell } from "@/components/settings/SettingsContent";

export default function SettingsIndexPage() {
  return <Navigate to="/settings/profile" replace />;
}

export function SettingsLayout() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
      <SettingsShell />
    </div>
  );
}
