const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const INLINE_TAGS = new Map([
  ["strong", "strong"],
  ["b", "strong"],
  ["em", "em"],
  ["i", "em"],
  ["u", "u"],
  ["br", "br"],
]);

export function sanitizeInlineMarkup(value = "") {
  value = value.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
  const tagPattern = /<\/?[a-z][^>]*>/gi;
  let result = "";
  let cursor = 0;

  for (const match of value.matchAll(tagPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    result += escapeTextPreservingEntities(value.slice(cursor, index));

    const tag = token.match(/^<\/?\s*([a-z]+)\b/i)?.[1]?.toLowerCase();
    const normalized = tag ? INLINE_TAGS.get(tag) : undefined;
    if (normalized) {
      result += token.startsWith("</") ? `</${normalized}>` : `<${normalized}>`;
    } else {
      result += escapeHtml(token);
    }
    cursor = index + token.length;
  }

  return result + escapeTextPreservingEntities(value.slice(cursor));
}

function escapeTextPreservingEntities(value) {
  return value
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[\da-f]+;)/gi, "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function blocksToEditorHtml(blocks) {
  return blocks
    .map((block) => {
      const id = escapeHtml(block.id);
      if (block.type === "IMAGE") {
        const src = escapeHtml(block.imageUrl || "");
        const storageId = escapeHtml(block.storageObjectId || "");
        const caption = escapeHtml(block.caption || "");
        return `<figure data-block-id="${id}" data-storage-id="${storageId}" contenteditable="false"><img src="${src}" alt="Ảnh trong bài viết"><input data-caption maxlength="500" value="${caption}" placeholder="Nhập chú thích ảnh..."><button type="button" data-remove-image>Xóa ảnh</button></figure>`;
      }
      const tag = block.type === "HEADING" ? "h2" : block.type === "QUOTE" ? "blockquote" : "p";
      return `<${tag} data-block-id="${id}">${sanitizeInlineMarkup(block.text || "")}</${tag}>`;
    })
    .join("");
}
