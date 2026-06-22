/**
 * Lightweight HTML sanitizer for rich-text fields produced by the TipTap editor
 * (description, recommendation). The editor only emits a small, known set of
 * formatting tags, so a conservative strip of dangerous constructs is enough —
 * we are not trying to be a general-purpose sanitizer.
 *
 * Removes: <script>/<style>/<iframe>/<object>/<embed> blocks, inline event
 * handlers (on*=...), and javascript: URLs.
 */
export function sanitizeHtml(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "<p></p>") return null;

  let html = trimmed;
  // Drop dangerous element blocks entirely (including their content)
  html = html.replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Drop any leftover self-closing / unclosed dangerous tags
  html = html.replace(/<\/?(script|style|iframe|object|embed)\b[^>]*>/gi, "");
  // Strip inline event handler attributes: on...="..." / on...='...' / on...=value
  html = html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Neutralize javascript: URLs in href/src
  html = html.replace(/((?:href|src)\s*=\s*)("|')\s*javascript:[^"']*\2/gi, '$1$2#$2');

  return html;
}
