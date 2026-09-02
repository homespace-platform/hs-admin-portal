import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Video,
  Camera,
  Building,
  Check,
} from "lucide-react";
import type { ListingMediaResponse } from "@/types/listing.type";
import { MediaLightboxModal } from "@/components/common/MediaGallery";

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

  const selectFilter = (nextFilter: "ALL" | "IMAGE" | "VIDEO") => {
    setFilterType(nextFilter);
    setSelectedIndex(0);
  };

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedMedia.length - 1));
  }, [displayedMedia.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < displayedMedia.length - 1 ? prev + 1 : 0));
  }, [displayedMedia.length]);

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
            onClick={() => selectFilter("ALL")}
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
              onClick={() => selectFilter("IMAGE")}
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
              onClick={() => selectFilter("VIDEO")}
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

      {/* ── Lightbox / Fullscreen Modal (Dùng chung MediaLightboxModal) ── */}
      <MediaLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaItems={displayedMedia.map((item) => ({
          id: item.id,
          type: item.mediaType === "VIDEO" ? "video" : "image",
          url: item.url!,
          alt: title || "Chi tiết tin đăng",
        }))}
        initialIndex={selectedIndex}
        title={title || "Chi tiết tin đăng"}
      />
    </div>
  );
}
