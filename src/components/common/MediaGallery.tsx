import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Play,
  X,
} from "lucide-react";

export interface MediaGalleryItem {
  id?: string;
  type?: "image" | "video";
  url: string;
  streamUrl?: string;
  alt?: string;
}

export interface MediaLightboxPrimaryAction {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  onAction: (item: MediaGalleryItem, index: number) => void | Promise<void>;
  isVisible?: (item: MediaGalleryItem, index: number) => boolean;
  isDisabled?: (item: MediaGalleryItem, index: number) => boolean;
}

export interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaGalleryItem[];
  initialIndex?: number;
  title?: string;
  alwaysShowThumbnails?: boolean;
  primaryAction?: MediaLightboxPrimaryAction;
}

/**
 * Fullscreen Lightbox Modal Dùng Chung (Admin & Web App)
 * Tái sử dụng để xem chi tiết ảnh/video cho Listing, User Avatar Profile, v.v.
 */
export function MediaLightboxModal({
  isOpen,
  onClose,
  mediaItems,
  initialIndex = 0,
  title = "Chi tiết hình ảnh",
  alwaysShowThumbnails = false,
  primaryAction,
}: MediaLightboxModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const total = mediaItems.length;

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(
        initialIndex >= 0 && initialIndex < total ? initialIndex : 0
      );
    }
  }, [isOpen, initialIndex, total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setSelectedIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setSelectedIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || total === 0) return null;

  const currentItem = mediaItems[selectedIndex] || mediaItems[0];
  const isVideo = currentItem.type === "video";
  const showPrimaryAction =
    primaryAction &&
    (primaryAction.isVisible?.(currentItem, selectedIndex) ?? true);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 text-white z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide shrink-0">
            {isVideo ? "Video" : "Ảnh"} {selectedIndex + 1} / {total}
          </span>
          <h3 className="text-sm font-medium text-white/80 truncate hidden sm:block">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Center Stage with Prev / Next */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Prev Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/10 cursor-pointer shadow-xl"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Content */}
        <div className="relative w-full h-full max-w-5xl max-h-[78vh] flex items-center justify-center">
          {isVideo ? (
            <video
              key={currentItem.streamUrl || currentItem.url}
              src={currentItem.streamUrl || currentItem.url}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              className="max-h-[78vh] max-w-full rounded-xl shadow-2xl bg-black"
            >
              Trình duyệt của bạn không hỗ trợ phát video HTML5.
            </video>
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.alt || `${title} - ảnh ${selectedIndex + 1}`}
              className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          )}
        </div>

        {/* Next Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/10 cursor-pointer shadow-xl"
            title="Ảnh sau (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {showPrimaryAction && (
        <div className="flex justify-center px-4 pb-3">
          <button
            type="button"
            onClick={() => primaryAction.onAction(currentItem, selectedIndex)}
            disabled={
              primaryAction.loading ||
              (primaryAction.isDisabled?.(currentItem, selectedIndex) ?? false)
            }
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primaryAction.loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>{primaryAction.loadingLabel ?? "Đang xử lý..."}</span>
              </>
            ) : (
              <span>{primaryAction.label}</span>
            )}
          </button>
        </div>
      )}

      {/* 3. Bottom Thumbnail Strip */}
      {(alwaysShowThumbnails || total > 1) && (
        <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center overflow-x-auto gap-2.5 max-w-full no-scrollbar">
          {mediaItems.map((item, idx) => {
            const isActive = idx === selectedIndex;
            const itemIsVideo = item.type === "video";

            return (
              <button
                key={item.id || `${item.url}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-black scale-105 opacity-100"
                    : "border-white/20 opacity-60 hover:opacity-90"
                }`}
              >
                {itemIsVideo ? (
                  <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <video
                      src={`${item.streamUrl || item.url}#t=0.5`}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || `Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MediaLightboxModal;
