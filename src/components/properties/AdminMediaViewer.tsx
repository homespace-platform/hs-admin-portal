import { useEffect, useRef, useState } from "react";
import { Play, Video, Camera, Building, Check, ChevronLeft, ChevronRight, Expand, ImageOff } from "lucide-react";
import type { ListingMediaResponse } from "@/types/listing.type";
import { MediaLightboxModal } from "@/components/common/MediaGallery";

interface AdminMediaViewerProps {
  media: ListingMediaResponse[];
  title?: string;
}

type FilterType = "ALL" | "IMAGE" | "VIDEO";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const navBtn = `absolute top-1/2 z-10 h-10 w-10 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md hover:bg-white active:scale-95 cursor-pointer ${focusRing}`;

function ImageSlide({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
        <ImageOff className="h-8 w-8" />
        <span className="text-xs font-medium">Không tải được ảnh</span>
      </div>
    );
  }
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted motion-reduce:animate-none" />}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
      />
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </>
  );
}

export default function AdminMediaViewer({ media = [], title = "" }: AdminMediaViewerProps) {
  const images = media.filter((m) => m.mediaType === "IMAGE" && m.url);
  const videos = media.filter((m) => m.mediaType === "VIDEO" && m.url);

  // Combined media items: images first, videos at the end
  const allMedia = [...images, ...videos];

  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [index, setIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const lastDx = useRef(0);

  const displayedMedia =
    filterType === "IMAGE" ? images : filterType === "VIDEO" ? videos : allMedia;
  const total = displayedMedia.length;
  const current = Math.min(index, Math.max(total - 1, 0));

  // Centre the active thumbnail by scrolling the strip only (never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[current] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [current, filterType]);

  const selectFilter = (nextFilter: FilterType) => {
    setFilterType(nextFilter);
    setIndex(0);
  };

  const go = (delta: number) => {
    if (total > 1) setIndex((current + delta + total) % total);
  };

  if (allMedia.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground">
        <Building className="h-10 w-10 opacity-30 mb-2" />
        <span className="text-xs font-medium">Chưa có hình ảnh hoặc video được tải lên</span>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${focusRing} ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
    }`;

  return (
    <div className="min-w-0 space-y-3">
      {/* Admin-only: media filter tabs */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Lọc phương tiện">
        <button type="button" role="tab" aria-selected={filterType === "ALL"} onClick={() => selectFilter("ALL")} className={tabClass(filterType === "ALL")}>
          Tất cả ({allMedia.length})
        </button>
        {images.length > 0 && (
          <button type="button" role="tab" aria-selected={filterType === "IMAGE"} onClick={() => selectFilter("IMAGE")} className={tabClass(filterType === "IMAGE")}>
            <Camera className="h-3.5 w-3.5" />
            Ảnh ({images.length})
          </button>
        )}
        {videos.length > 0 && (
          <button type="button" role="tab" aria-selected={filterType === "VIDEO"} onClick={() => selectFilter("VIDEO")} className={tabClass(filterType === "VIDEO")}>
            <Video className="h-3.5 w-3.5 text-rose-500" />
            Video ({videos.length})
          </button>
        )}
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Thư viện hình ảnh"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          else if (e.key === "ArrowRight") go(1);
        }}
        className={`w-full min-w-0 rounded-2xl select-none ${focusRing}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-950">
          <div
            className="h-full w-full cursor-pointer"
            style={{ touchAction: "pan-y" }}
            onPointerDown={(e) => {
              startX.current = e.clientX;
              lastDx.current = 0;
            }}
            onPointerUp={(e) => {
              if (startX.current === null) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              lastDx.current = dx;
              if (Math.abs(dx) >= 40) go(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              startX.current = null;
            }}
            onClick={() => {
              if (Math.abs(lastDx.current) < 8) setIsLightboxOpen(true);
            }}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {displayedMedia.map((item, i) => (
                <div
                  key={item.id || `${item.url}-${i}`}
                  className="relative h-full w-full shrink-0 overflow-hidden bg-slate-950"
                  aria-hidden={i !== current}
                >
                  {item.mediaType === "VIDEO" ? (
                    <>
                      <video
                        src={`${item.url}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg">
                          <Play className="h-7 w-7 translate-x-0.5 fill-slate-900" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <ImageSlide src={item.url!} alt={`${title || "Ảnh"} - ${i + 1}`} />
                  )}
                  {item.cover && item.mediaType !== "VIDEO" && (
                    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-lg bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-md">
                      <Check className="h-3.5 w-3.5" />
                      <span>Ảnh bìa</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {total > 1 && (
            <>
              <button type="button" aria-label="Ảnh trước" onClick={() => go(-1)} className={`${navBtn} left-3`}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Ảnh tiếp theo" onClick={() => go(1)} className={`${navBtn} right-3`}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <span
            aria-live="polite"
            className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold tabular-nums text-white"
          >
            {current + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className={`absolute bottom-3 right-3 z-10 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-semibold text-slate-900 shadow-md ${focusRing}`}
          >
            <Expand className="h-4 w-4" aria-hidden="true" />
            Toàn màn hình
          </button>
        </div>

        {total > 1 && (
          <div ref={stripRef} className="mt-3 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {displayedMedia.map((item, i) => {
              const active = i === current;
              return (
                <button
                  key={item.id || `${item.url}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Xem ${item.mediaType === "VIDEO" ? "video" : "ảnh"} ${i + 1}`}
                  aria-current={active ? "true" : undefined}
                  className={`relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted ${focusRing} ${
                    active
                      ? "opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.mediaType === "VIDEO" ? (
                    <>
                      <video src={`${item.url}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover pointer-events-none" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-5 w-5 fill-white text-white" />
                      </span>
                    </>
                  ) : (
                    <img src={item.url ?? undefined} alt="" className="h-full w-full object-cover" />
                  )}
                  {item.cover && item.mediaType !== "VIDEO" && (
                    <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" title="Ảnh bìa" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Modal (shared MediaLightboxModal); gallery follows its index */}
      <MediaLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaItems={displayedMedia.map((item) => ({
          id: item.id,
          type: item.mediaType === "VIDEO" ? "video" : "image",
          url: item.url!,
          alt: title || "Chi tiết tin đăng",
        }))}
        initialIndex={current}
        title={title || "Chi tiết tin đăng"}
        onIndexChange={setIndex}
      />
    </div>
  );
}
