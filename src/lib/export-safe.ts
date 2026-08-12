/* ---------------------------------------------------------------------------
   Making user text safe to hand to another program.

   Feedback bodies arrive from the open internet through the widget. When we
   later put them into a file or the clipboard, the receiving program — Excel,
   Sheets, Notion — has its own parsing rules, and a leading `=` or a stray
   backtick becomes code there. These helpers neutralise that at the boundary.
--------------------------------------------------------------------------- */

/**
 * One CSV cell, quoted and formula-safe.
 *
 * Quote-doubling alone stops the *delimiter* breaking the row, but the
 * spreadsheet strips the quotes before evaluating the cell, so `=`, `+`, `-`,
 * `@`, and leading tab/CR still start a live formula (`=IMPORTXML(...)` can
 * exfiltrate the sheet; `=cmd|...` is DDE code execution). Prefixing a single
 * quote makes the app treat the whole cell as text.
 */
export function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * Inline text for a Markdown document. Wraps the value in backticks (escaping
 * any it contains) so markup, links, and formatting in the source render as
 * literal characters wherever it's pasted.
 */
export function mdInline(value: string): string {
  // A backtick inside would close the span early; a newline would break out of
  // the list item. Both are rare in a quote and losing them costs nothing.
  const cleaned = value.replace(/`/g, "'").replace(/\s*\n\s*/g, " ").trim();
  return `\`${cleaned}\``;
}
