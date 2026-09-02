import {
  useEffect,
  useRef,
  type ChangeEvent,
  type MouseEvent,
  type ReactElement,
} from "react";
import { Heading2, ImagePlus, Pilcrow, Quote, Undo2, Redo2 } from "lucide-react";
import type { NewsBlockType } from "@/types/news.type";
import { blocksToEditorHtml } from "@/utils/newsEditorDocument.js";

export type EditorBlock = {
  id: string;
  type: NewsBlockType;
  text: string;
  storageObjectId: string | null;
  imageUrl: string;
  file: File | null;
  altText: string;
};

export default function NewsRichEditor({
  value,
  onChange,
}: {
  value: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const emittedValueRef = useRef<EditorBlock[] | null>(null);
  const selectedBlockRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    for (const block of value) {
      if (block.file) filesRef.current.set(block.id, block.file);
      else filesRef.current.delete(block.id);
    }
    if (emittedValueRef.current === value) return;
    if (editorRef.current) editorRef.current.innerHTML = blocksToEditorHtml(value);
  }, [value]);

  function readBlocks() {
    const editor = editorRef.current;
    if (!editor) return;
    const blocks: EditorBlock[] = [];
    for (const node of Array.from(editor.children)) {
      const element = node as HTMLElement;
      const tag = element.tagName;
      if (tag === "FIGURE") {
        const id = element.dataset.blockId || crypto.randomUUID();
        const image = element.querySelector("img");
        const altInput = element.querySelector<HTMLInputElement>("[data-alt-text]");
        blocks.push({
          id,
          type: "IMAGE",
          text: "",
          storageObjectId: element.dataset.storageId || null,
          imageUrl: image?.src || "",
          file: filesRef.current.get(id) || null,
          altText: altInput?.value || "",
        });
        continue;
      }
      const text = element.innerText.replace(/\u00a0/g, " ");
      blocks.push({
        id: element.dataset.blockId || crypto.randomUUID(),
        type: tag === "H2" ? "HEADING" : tag === "BLOCKQUOTE" ? "QUOTE" : "PARAGRAPH",
        text,
        storageObjectId: null,
        imageUrl: "",
        file: null,
        altText: "",
      });
    }
    const nextValue = blocks.length ? blocks : [emptyParagraph()];
    emittedValueRef.current = nextValue;
    onChange(nextValue);
  }

  function formatBlock(tag: "p" | "h2" | "blockquote") {
    document.execCommand("formatBlock", false, tag);
    readBlocks();
  }

  function chooseImage() {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    selectedBlockRef.current = anchor
      ? (anchor.nodeType === Node.ELEMENT_NODE ? anchor as HTMLElement : anchor.parentElement)?.closest("p,h2,blockquote,figure") as HTMLElement | null
      : null;
    fileInputRef.current?.click();
  }

  function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editorRef.current) return;

    const id = crypto.randomUUID();
    filesRef.current.set(id, file);
    const figure = createImageFigure(id, URL.createObjectURL(file));
    const paragraph = document.createElement("p");
    paragraph.dataset.blockId = crypto.randomUUID();
    paragraph.innerHTML = "<br>";
    const selectedBlock = selectedBlockRef.current;
    if (selectedBlock?.parentElement === editorRef.current) {
      selectedBlock.after(figure, paragraph);
    } else {
      editorRef.current.append(figure, paragraph);
    }
    paragraph.focus();
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    readBlocks();
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest("[data-remove-image]");
    if (!button) return;
    const figure = button.closest("figure");
    if (!figure) return;
    const id = (figure as HTMLElement).dataset.blockId;
    const src = figure.querySelector("img")?.src;
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    if (id) filesRef.current.delete(id);
    figure.remove();
    readBlocks();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/35 p-2">
        <ToolButton label="Hoàn tác" onClick={() => document.execCommand("undo")}><Undo2 /></ToolButton>
        <ToolButton label="Làm lại" onClick={() => document.execCommand("redo")}><Redo2 /></ToolButton>
        <span className="mx-1 h-6 w-px bg-border" />
        <ToolButton label="Đoạn văn" onClick={() => formatBlock("p")}><Pilcrow /></ToolButton>
        <ToolButton label="Tiêu đề phụ" onClick={() => formatBlock("h2")}><Heading2 /></ToolButton>
        <ToolButton label="Trích dẫn" onClick={() => formatBlock("blockquote")}><Quote /></ToolButton>
        <span className="mx-1 h-6 w-px bg-border" />
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={chooseImage} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground">
          <ImagePlus className="h-4 w-4" /> Chèn ảnh
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={insertImage} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        aria-label="Nội dung bài viết"
        onInput={readBlocks}
        onClick={handleClick}
        data-placeholder="Bắt đầu viết nội dung bài..."
        className="news-rich-editor min-h-[420px] px-5 py-4 text-sm leading-7 text-foreground outline-none"
      />
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        Ảnh mới chỉ được lưu tạm; S3 chỉ được gọi khi bạn lưu nháp hoặc xuất bản.
      </p>
    </div>
  );
}

function emptyParagraph(): EditorBlock {
  return { id: crypto.randomUUID(), type: "PARAGRAPH", text: "", storageObjectId: null, imageUrl: "", file: null, altText: "" };
}

function createImageFigure(id: string, src: string) {
  const figure = document.createElement("figure");
  figure.dataset.blockId = id;
  figure.contentEditable = "false";
  const image = document.createElement("img");
  image.src = src;
  image.alt = "Ảnh trong bài viết";
  const input = document.createElement("input");
  input.dataset.altText = "";
  input.maxLength = 500;
  input.placeholder = "Mô tả ảnh cho trình đọc màn hình";
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.removeImage = "";
  button.textContent = "Xóa ảnh";
  figure.append(image, input, button);
  return figure;
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactElement }) {
  return <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground [&_svg]:h-4 [&_svg]:w-4">{children}</button>;
}
