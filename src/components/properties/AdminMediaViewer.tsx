import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Video,
  Camera,
  X,
  Building,
  Check,
} from "lucide-react";
import type { ListingMediaResponse } from "@/types/listing.type";

interface AdminMediaViewerProps {
  media: ListingMediaResponse[];
  title?: string;
}

export default function AdminMediaViewer({ media = [], title = "" }: AdminMediaViewerProps) {
  const images = media.filter((m) => m.mediaType === "IMAGE" && m.url);
  const videos = media.filter((m) => m.mediaType === "VIDEO" && m.url);

  // Combined media items: images first, videos at the end
  const allMedia = [...images, ...videos];

  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const displayedMedia =
    filterType === "IMAGE" ? images : filterType === "VIDEO" ? videos : allMedia;

  const currentItem = displayedMedia[selectedIndex] || displayedMedia[0] || null;

  // Reset index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filterType]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedMedia.length - 1));
  }, [displayedMedia.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < displayedMedia.length - 1 ? prev + 1 : 0));
  }, [displayedMedia.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  if (allMedia.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground">
        <Building className="h-10 w-10 opacity-30 mb-2" />
        <span className="text-xs font-medium">Chưa có hình ảnh hoặc video được tải lên</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Top Bar: Filter Tabs & Fullscreen Button ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả ({allMedia.length})
          </button>
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("IMAGE")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "IMAGE"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Ảnh ({images.length})</span>
            </button>
          )}
          {videos.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("VIDEO")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "VIDEO"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="h-3.5 w-3.5 text-rose-500" />
              <span>Video ({videos.length})</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
          title="Phóng to xem chi tiết toàn màn hình"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Phóng to xem chi tiết</span>
          <span className="sm:hidden">Phóng to</span>
        </button>
      </div>

      {/* ── Main Stage ── */}
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-sm group select-none">
        {currentItem?.mediaType === "VIDEO" ? (
          <div className="relative h-full w-full flex items-center justify-center bg-black">
            <video
              key={currentItem.id || currentItem.url}
              src={currentItem.url || undefined}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
            {/* Top-right badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-md pointer-events-none">
              <Video className="h-3.5 w-3.5" />
              <span>Video</span>
            </div>
          </div>
        ) : currentItem?.url ? (
          <div className="relative h-full w-full">
            <img
              src={currentItem.url}
              alt={title || `Ảnh ${selectedIndex + 1}`}
              className="h-full w-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-102"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Hover overlay button to zoom */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0 bg-black/25 flex items-center justify-center cursor-zoom-in"
            >
              <div className="px-4 py-2 rounded-full bg-black/75 text-white text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md">
                <Maximize2 className="h-4 w-4" />
                <span>Bấm để phóng to xem ảnh</span>
              </div>
            </div>

            {/* Badges */}
            {currentItem.cover && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-md backdrop-blur-xs pointer-events-none">
                <Check className="h-3.5 w-3.5" />
                <span>Ảnh bìa</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Building className="h-10 w-10 opacity-30" />
          </div>
        )}

        {/* Navigation Arrows on Stage */}
        {displayedMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer z-10"
              title="Xem mục trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer z-10"
              title="Xem mục sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white pointer-events-none">
          {currentItem?.mediaType === "VIDEO" ? "Video" : "Ảnh"} {selectedIndex + 1} / {displayedMedia.length}
        </div>
      </div>

      {/* ── Thumbnails Strip ── */}
      {displayedMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 max-w-full">
          {displayedMedia.map((m, idx) => {
            const isSelected = idx === selectedIndex;
            const isVid = m.mediaType === "VIDEO";

            return (
              <button
                key={m.id || `${m.url}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 scale-95 shadow-md"
                    : "border-transparent opacity-65 hover:opacity-100"
                }`}
              >
                {isVid ? (
                  <div className="relative h-full w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <video
                      src={`${m.url}#t=0.5`}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">
                      VID
                    </div>
                  </div>
                ) : (
                  <img
                    src={m.url || "/area/hcm-1.jpg"}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Lightbox / Fullscreen Modal ── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 text-white z-20">
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide">
                {currentItem?.mediaType === "VIDEO" ? "Video" : "Ảnh"}{" "}
                {selectedIndex + 1} / {displayedMedia.length}
              </span>
              <h3 className="text-sm font-medium text-white/80 truncate hidden sm:block">
                {title || "Chi tiết tin đăng"}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Stage */}
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {displayedMedia.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/10 cursor-pointer shadow-xl"
                title="Trước (Mũi tên trái)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-full max-w-5xl max-h-[78vh] flex items-center justify-center">
              {currentItem?.mediaType === "VIDEO" ? (
                <video
                  key={currentItem.id || currentItem.url}
                  src={currentItem.url || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[78vh] max-w-full rounded-xl shadow-2xl bg-black"
                />
              ) : currentItem?.url ? (
                <img
                  src={currentItem.url}
                  alt={title || `Ảnh ${selectedIndex + 1}`}
                  className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl"
                />
              ) : null}
            </div>

            {displayedMedia.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-md border border-white/10 cursor-pointer shadow-xl"
                title="Sau (Mũi tên phải)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {displayedMedia.length > 1 && (
            <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center overflow-x-auto gap-2.5 max-w-full">
              {displayedMedia.map((item, idx) => {
                const isActive = idx === selectedIndex;
                const isVid = item.mediaType === "VIDEO";

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
                    {isVid ? (
                      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        <video
                          src={`${item.url}#t=0.5`}
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
                        src={item.url || "/area/hcm-1.jpg"}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
