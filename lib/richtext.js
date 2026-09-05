// A tiny, deliberately limited markdown-lite: **bold**, *italic*, and
// "- " bullet lines. Descriptions are public, unauthenticated submissions,
// so we never store or render raw HTML — this keeps formatting expressive
// without opening an XSS hole.
import { Fragment, createElement } from "react";

function renderInline(text, keyPrefix) {
  const nodes = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(createElement("strong", { key: `${keyPrefix}-${i++}` }, m[2]));
    } else {
      nodes.push(createElement("em", { key: `${keyPrefix}-${i++}` }, m[3]));
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderRichText(source) {
  const text = (source || "").trim();
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) {
      blocks.push(
        createElement("ul", { key: `ul-${blocks.length}` }, list)
      );
      list = null;
    }
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (!list) list = [];
      list.push(
        createElement("li", { key: `li-${idx}` }, renderInline(bullet[1], `li-${idx}`))
      );
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        createElement("p", { key: `p-${idx}` }, renderInline(line, `p-${idx}`))
      );
    }
  });
  flushList();

  return createElement(Fragment, null, blocks);
}
