import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Save,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import NewsRichEditor, {
  type EditorBlock,
} from "@/components/news/NewsRichEditor";
import adminNewsService from "@/services/admin-news.service";
import storageService from "@/services/storage.service";
import type {
  NewsCategory,
  NewsContentBlock,
  NewsStatus,
  NewsUpsertRequest,
} from "@/types/news.type";
import { getApiErrorMessage } from "@/utils/apiError";
import { sanitizeInlineMarkup } from "@/utils/newsEditorDocument.js";

const CATEGORIES: readonly [NewsCategory, string][] = [
  ["MARKET", "Thị trường"],
  ["LEGAL", "Pháp lý"],
  ["GUIDE", "Cẩm nang"],
  ["INVESTMENT", "Đầu tư"],
  ["TREND", "Xu hướng"],
];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function createBlock(): EditorBlock {
  return {
    id: crypto.randomUUID(),
    type: "PARAGRAPH",
    text: "",
    storageObjectId: null,
    imageUrl: "",
    file: null,
    caption: "",
  };
}

function blockHasContent(block: EditorBlock) {
  return block.type === "IMAGE"
    ? Boolean(block.file || block.storageObjectId)
    : block.text.trim().length > 0;
}

type SavedDraft = {
  title: string;
  slug: string;
  slugEdited: boolean;
  summary: string;
  coverImage: string;
  coverStorageId: string | null;
  category: NewsCategory;
  tags: string[];
  status: NewsStatus;
  isFeatured: boolean;
  blocks: Array<Omit<EditorBlock, "file"> & { file: null }>;
};

function draftStorageKey(newsId?: string) {
  return `homespace-news-editor:${newsId || "new"}`;
}

function readSavedDraft(key: string): SavedDraft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedDraft) : null;
  } catch {
    return null;
  }
}

export default function NewsEditorPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState("");
  const [coverStorageId, setCoverStorageId] = useState<string | null>(null);
  const [category, setCategory] = useState<NewsCategory>("MARKET");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<NewsStatus>("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => [
    createBlock(),
  ]);
  const [loading, setLoading] = useState(Boolean(newsId));
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function restoreDraft(draft: SavedDraft) {
    setTitle(draft.title);
    setSlug(draft.slug);
    setSlugEdited(draft.slugEdited);
    setSummary(draft.summary);
    setCoverImage(draft.coverImage);
    setCoverStorageId(draft.coverStorageId);
    setCategory(draft.category);
    setTags(draft.tags);
    setStatus(draft.status);
    setIsFeatured(draft.isFeatured);
    setBlocks(draft.blocks.length ? draft.blocks : [createBlock()]);
  }

  useEffect(() => {
    const key = draftStorageKey(newsId);
    const savedDraft = readSavedDraft(key);
    if (!newsId) {
      if (savedDraft) queueMicrotask(() => restoreDraft(savedDraft));
      queueMicrotask(() => setDraftReady(true));
      return;
    }

    adminNewsService
      .getById(newsId)
      .then((article) => {
        const mediaByStorageId = new Map(
          article.media.map((item) => [item.storageObjectId, item]),
        );
        const thumbnail = article.media.find(
          (item) => item.role === "THUMBNAIL",
        );
        setTitle(article.title);
        setSlug(article.slug);
        setSlugEdited(true);
        setSummary(article.summary);
        setCategory(article.category);
        setTags(article.tags);
        setStatus(article.status);
        setIsFeatured(article.featured);
        setCoverImage(article.thumbnailUrl ?? "");
        setCoverStorageId(thumbnail?.storageObjectId ?? null);
        setBlocks(
          article.contentBlocks.length
            ? article.contentBlocks.map((block) => {
                const media = block.storageObjectId
                  ? mediaByStorageId.get(block.storageObjectId)
                  : undefined;
                return {
                  id: crypto.randomUUID(),
                  type: block.type,
                  text: block.text ?? "",
                  storageObjectId: block.storageObjectId,
                  imageUrl: media?.url ?? "",
                  file: null,
                  caption: block.caption ?? "",
                };
              })
            : [createBlock()],
        );
      })
      .catch((error) => {
        if (savedDraft) restoreDraft(savedDraft);
        toast.error(getApiErrorMessage(error, "Không thể tải bài viết."));
      })
      .finally(() => {
        setLoading(false);
        setDraftReady(true);
      });
  }, [newsId]);

  useEffect(() => {
    if (!draftReady) return;
    const draft: SavedDraft = {
      title,
      slug,
      slugEdited,
      summary,
      coverImage: coverFile ? "" : coverImage,
      coverStorageId,
      category,
      tags,
      status,
      isFeatured,
      blocks: blocks
        .filter((block) => block.type !== "IMAGE" || block.storageObjectId)
        .map((block) => ({ ...block, file: null })),
    };
    try {
      localStorage.setItem(draftStorageKey(newsId), JSON.stringify(draft));
    } catch {
      // Draft persistence is best-effort when browser storage is unavailable.
    }
  }, [blocks, category, coverFile, coverImage, coverStorageId, draftReady, isFeatured, newsId, slug, slugEdited, status, summary, tags, title]);

  function updateBlock(id: string, changes: Partial<EditorBlock>) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, ...changes } : block,
      ),
    );
  }

  function addTag(value: string) {
    const tag = value.trim().replace(/,$/, "");
    if (tag && !tags.includes(tag) && tags.length < 20)
      setTags((current) => [...current, tag]);
    setTagInput("");
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    }
    if (event.key === "Backspace" && !tagInput && tags.length > 0)
      setTags((current) => current.slice(0, -1));
  }

  async function saveArticle(nextStatus: NewsStatus) {
    if (!title.trim() || !slug.trim() || !summary.trim()) {
      toast.error("Hãy nhập đầy đủ tiêu đề, slug và mô tả ngắn.");
      return;
    }
    if (nextStatus === "PUBLISHED" && !coverFile && !coverStorageId) {
      toast.error("Hãy chọn ảnh đại diện trước khi xuất bản.");
      return;
    }
    const contentBlocks = blocks.filter(blockHasContent);
    if (nextStatus === "PUBLISHED" && contentBlocks.length === 0) {
      toast.error("Hãy nhập nội dung bài viết trước khi xuất bản.");
      return;
    }

    setSaving(true);
    try {
      let thumbnailStorageObjectId = coverStorageId;
      if (coverFile) {
        thumbnailStorageObjectId =
          await storageService.uploadNewsImage(coverFile);
        setCoverStorageId(thumbnailStorageObjectId);
        setCoverFile(null);
      }

      const requestBlocks: NewsContentBlock[] = [];
      for (const block of contentBlocks) {
        let storageObjectId = block.storageObjectId;
        if (block.type === "IMAGE" && block.file) {
          storageObjectId = await storageService.uploadNewsImage(block.file);
          updateBlock(block.id, { storageObjectId, file: null });
        }
        requestBlocks.push({
          type: block.type,
          text: block.type === "IMAGE" ? null : block.text.trim(),
          storageObjectId: block.type === "IMAGE" ? storageObjectId : null,
          caption: block.type === "IMAGE" ? block.caption.trim() || null : null,
        });
      }

      const request: NewsUpsertRequest = {
        title: title.trim(),
        slug: slugify(slug),
        summary: summary.trim(),
        category,
        status: nextStatus,
        featured: isFeatured,
        tags,
        thumbnailStorageObjectId,
        contentBlocks: requestBlocks,
      };
      if (newsId) await adminNewsService.update(newsId, request);
      else await adminNewsService.create(request);
      localStorage.removeItem(draftStorageKey(newsId));
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Đã xuất bản bài viết."
          : "Đã lưu bài viết nháp.",
      );
      navigate("/operations/news");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu bài viết."));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Đang tải bài viết...
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link
            to="/operations/news"
            className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Vận hành &amp; Hỗ trợ
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {newsId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Soạn nội dung tin tức để chia sẻ với cộng đồng HomeSpace.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Nội dung chữ được tự động lưu trên trình duyệt, có thể khôi phục sau khi F5.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          Người viết: tự lấy từ tài khoản admin
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <Field label="Tiêu đề bài viết" required>
            <input
              value={title}
              maxLength={255}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugEdited) setSlug(slugify(event.target.value));
              }}
              placeholder="Nhập tiêu đề bài viết..."
              className="form-input"
            />
          </Field>
          <Field label="Slug" required>
            <input
              value={slug}
              maxLength={255}
              onChange={(event) => {
                setSlug(slugify(event.target.value));
                setSlugEdited(true);
              }}
              placeholder="tieu-de-bai-viet"
              className="form-input font-mono text-xs"
            />
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
              Đường dẫn bài viết:{" "}
              <span className="font-mono text-foreground">
                /news/{slug || "tieu-de-bai-viet"}
              </span>
            </p>
          </Field>
          <Field label="Mô tả ngắn" required>
            <textarea
              value={summary}
              maxLength={1000}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Tóm tắt nội dung bài viết trong 1–2 câu..."
              rows={3}
              className="form-input resize-y"
            />
          </Field>
          <div>
            <span className="mb-2 block text-xs font-bold text-foreground">
              Nội dung bài viết<span className="ml-1 text-destructive">*</span>
            </span>
            <NewsRichEditor value={blocks} onChange={setBlocks} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">
              Thông tin xuất bản
            </h2>
            <div className="mt-4 space-y-4">
              <Field label="Danh mục" required>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as NewsCategory)
                  }
                  className="form-input"
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Trạng thái">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as NewsStatus)
                  }
                  className="form-input"
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PUBLISHED">Xuất bản</option>
                </select>
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block text-xs font-bold text-foreground">
                    Bài viết nổi bật
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                    Hiển thị ở vị trí nổi bật trên trang tin tức.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">Ảnh đại diện</h2>
            <label className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:bg-muted">
              <ImagePlus className="h-4 w-4" /> Chọn ảnh từ máy
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setCoverFile(file);
                    setCoverStorageId(null);
                    setCoverImage(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
            {coverImage ? (
              <img
                src={coverImage}
                alt="Xem trước ảnh đại diện"
                className="mt-3 aspect-video w-full rounded-xl object-cover"
              />
            ) : (
              <div className="mt-3 flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                Chưa chọn ảnh
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">Tags</h2>
            <div className="mt-4 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTags((current) => current.filter((item) => item !== tag))
                  }
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20"
                >
                  {tag} ×
                </button>
              ))}
              <input
                value={tagInput}
                maxLength={50}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={
                  tags.length ? "Thêm tag..." : "Nhập tag rồi Enter..."
                }
                className="min-w-28 flex-1 bg-transparent text-xs outline-none"
              />
            </div>
          </section>
        </aside>
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            setPreviewOpen(true)
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Eye className="h-4 w-4" /> Xem trước
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveArticle("DRAFT")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu nháp"}
        </button>
        <button
          type="button"
          disabled={saving || !title.trim() || !summary.trim()}
          onClick={() => saveArticle("PUBLISHED")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-4 w-4" /> {saving ? "Đang lưu..." : "Xuất bản"}
        </button>
      </div>
      {previewOpen && (
        <PreviewModal
          title={title}
          summary={summary}
          coverImage={coverImage}
          category={category}
          tags={tags}
          blocks={blocks}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function PreviewModal({ title, summary, coverImage, category, tags, blocks, onClose }: {
  title: string; summary: string; coverImage: string; category: NewsCategory;
  tags: string[]; blocks: EditorBlock[]; onClose: () => void;
}) {
  const categoryLabel = CATEGORIES.find(([value]) => value === category)?.[1] || category;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Xem trước bài viết">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Đóng xem trước" className="sticky right-4 top-4 z-10 float-right m-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow hover:text-foreground"><X className="h-4 w-4" /></button>
        <article className="mx-auto max-w-3xl p-6 sm:p-10">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{categoryLabel}</span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-foreground">{title || "Tiêu đề bài viết"}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{summary || "Mô tả ngắn bài viết"}</p>
          {coverImage && <img src={coverImage} alt="Ảnh đại diện" className="mt-7 aspect-video w-full rounded-2xl object-cover" />}
          <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">
            {blocks.filter(blockHasContent).map((block) => block.type === "IMAGE" ? (
              <figure key={block.id} className="space-y-2">
                <img src={block.imageUrl} alt="Ảnh trong bài viết" className="w-full rounded-2xl object-contain" />
                {block.caption.trim() && <figcaption className="text-center text-xs italic text-muted-foreground">{block.caption}</figcaption>}
              </figure>
              ) : block.type === "HEADING" ? <h2 key={block.id} className="text-xl font-bold text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeInlineMarkup(block.text) }} />
                  : block.type === "QUOTE" ? <blockquote key={block.id} className="my-4 border-l-4 border-primary bg-primary/5 py-3 pl-4 italic text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeInlineMarkup(block.text) }} />
                  : <p key={block.id} dangerouslySetInnerHTML={{ __html: sanitizeInlineMarkup(block.text) }} />)}
          </div>
          {tags.length > 0 && <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-5">{tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">#{tag}</span>)}</div>}
        </article>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
