import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { openSettings } from "@/components/settings/open-settings";
import { isSettingsSectionId } from "@/components/settings/settings-nav";

/** Deep links /settings and /settings/:section open the settings dialog (same as the web app) over the dashboard. */
export default function SettingsRedirect() {
  const { section } = useParams<{ section: string }>();
  const tab = section && isSettingsSectionId(section) ? section : "profile";
  useEffect(() => {
    // Fire after the redirect to /dashboard has rendered (this component unmounts then), so the
    // dialog is not closed by the route change. Not cleared on unmount on purpose.
    window.setTimeout(() => openSettings(tab), 50);
  }, [tab]);
  return <Navigate to="/dashboard" replace />;
}
