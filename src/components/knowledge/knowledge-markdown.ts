/** YAML is deliberately kept outside the rich editor. */
export function splitKnowledgeMarkdown(markdown: string): { metadata: string; body: string } {
  const match = /^(---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$))([\s\S]*)$/.exec(markdown);
  if (!match) throw new Error("Tài liệu không có YAML metadata hợp lệ.");
  return { metadata: match[1], body: match[2] };
}

export function joinKnowledgeMarkdown(metadata: string, body: string): string {
  return `${metadata}\n${body.trim()}\n`;
}

export function isSafeKnowledgeLink(value: string): boolean {
  try { return ["http:", "https:", "mailto:"].includes(new URL(value).protocol); }
  catch { return false; }
}
