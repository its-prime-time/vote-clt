/**
 * markdown.ts
 *
 * Renders a Markdown string to HTML at build time. Used for editorial copy
 * that needs links or lists — FAQ answers, for instance — so it can be written
 * as plain text in `src/data/` instead of hand-written HTML.
 *
 * This only ever runs inside Astro's build (page frontmatter), so `marked`
 * never ships to the browser. The content is our own committed copy, so it is
 * not sanitized; do not feed user input through it.
 */

import { marked, type Tokens } from 'marked';

marked.use({
  // No auto-<br> on single newlines, no GitHub-specific extensions.
  gfm: false,
  breaks: false,
  renderer: {
    // Open off-site links in a new tab; same-site links stay in the tab.
    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//i.test(href);
      const attrs = [
        `href="${escapeAttribute(href)}"`,
        title ? `title="${escapeAttribute(title)}"` : '',
        external ? 'target="_blank" rel="noopener"' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<a ${attrs}>${text}</a>`;
    },
  },
});

/** Markdown → HTML. Throws on anything but a string so mistakes surface at build time. */
export function renderMarkdown(markdown: string): string {
  if (typeof markdown !== 'string') {
    throw new TypeError(`renderMarkdown expected a string, got ${typeof markdown}`);
  }
  // marked.parse is synchronous unless async extensions are registered.
  return marked.parse(markdown.trim()) as string;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
