import type { SettingsSectionId } from "./settings-nav";

const EVENT = "hs:open-settings";

/** Opens the settings dialog (owned by AdminLayout) like the web app; /settings/* routes only redirect here. */
export function openSettings(tab: SettingsSectionId = "profile"): void {
  window.dispatchEvent(new CustomEvent<SettingsSectionId>(EVENT, { detail: tab }));
}

export function onOpenSettings(handler: (tab: SettingsSectionId) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<SettingsSectionId>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
