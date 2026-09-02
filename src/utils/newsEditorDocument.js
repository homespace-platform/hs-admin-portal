const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function blocksToEditorHtml(blocks) {
  return blocks
    .map((block) => {
      const id = escapeHtml(block.id);
      if (block.type === "IMAGE") {
        const src = escapeHtml(block.imageUrl || "");
        const storageId = escapeHtml(block.storageObjectId || "");
        const alt = escapeHtml(block.altText || "");
        return `<figure data-block-id="${id}" data-storage-id="${storageId}" contenteditable="false"><img src="${src}" alt="${alt}"><input data-alt-text maxlength="500" value="${alt}" placeholder="Mô tả ảnh cho trình đọc màn hình"><button type="button" data-remove-image>Xóa ảnh</button></figure>`;
      }
      const tag = block.type === "HEADING" ? "h2" : block.type === "QUOTE" ? "blockquote" : "p";
      return `<${tag} data-block-id="${id}">${escapeHtml(block.text || "")}</${tag}>`;
    })
    .join("");
}
