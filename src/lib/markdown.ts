import { marked } from "marked";
import type { TocItem, IndexItem } from "./types";

// slugify heading text into a stable anchor
export function slugify(text: string): string {
  return (
    "s-" +
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
  );
}

// Extract a table of contents from markdown headings.
export function buildToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = markdown.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) {
      const level = m[1].length;
      const title = m[2].replace(/[#*`]/g, "").trim();
      if (title) toc.push({ level, title, anchor: slugify(title + "-" + toc.length) });
    }
  }
  return toc;
}

// Heuristic keyword index: pick **bold** terms and 「…」 quoted terms.
export function buildIndex(markdown: string): IndexItem[] {
  const counts = new Map<string, number>();
  const add = (t: string) => {
    const term = t.trim();
    if (term.length < 2 || term.length > 24) return;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  };
  const boldRe = /\*\*(.+?)\*\*/g;
  const kagiRe = /「(.+?)」/g;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(markdown))) add(m[1]);
  while ((m = kagiRe.exec(markdown))) add(m[1]);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([term, n]) => ({ term, refs: [`${n}回`] }));
}

// Render markdown -> HTML, injecting anchors on headings + highlighting index terms.
export function renderHtml(markdown: string, opts?: { toc?: TocItem[]; index?: IndexItem[] }): string {
  marked.setOptions({ gfm: true, breaks: true });
  let html = marked.parse(markdown) as string;

  // add ids to headings (match order of toc)
  if (opts?.toc) {
    let i = 0;
    html = html.replace(/<(h[1-4])>/g, (full, tag) => {
      const item = opts.toc![i++];
      return item ? `<${tag} id="${item.anchor}">` : full;
    });
  }
  // highlight index terms
  if (opts?.index) {
    for (const it of opts.index) {
      const safe = it.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(
        new RegExp(`(?<!<[^>]*)(${safe})`, "g"),
        '<mark class="kw">$1</mark>'
      );
    }
  }
  return html;
}
