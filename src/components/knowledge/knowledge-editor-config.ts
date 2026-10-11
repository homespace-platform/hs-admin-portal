import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";

export function knowledgeEditorExtensions() {
  return [
    StarterKit.configure({ underline: false, link: { openOnClick: false, autolink: false } }),
    TableKit.configure({ table: { resizable: false } }),
    Markdown.configure({ markedOptions: { gfm: true } }),
  ];
}
