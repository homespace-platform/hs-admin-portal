import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SettingsContent from "./SettingsContent";
import type { SettingsSectionId } from "./settings-nav";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsSectionId;
}

/** Settings as a centered dialog (same as the web app); /settings/* routes stay for deep links. */
export default function SettingsModal({ isOpen, onClose, initialTab = "profile" }: SettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 animate-in fade-in-50 duration-200">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        tabIndex={-1}
        className="relative z-10 h-full w-full max-w-4xl outline-none sm:h-[min(680px,90vh)] animate-in zoom-in-95 duration-200"
      >
        <SettingsContent onClose={onClose} initialTab={initialTab} />
      </div>
    </div>,
    document.body,
  );
}
