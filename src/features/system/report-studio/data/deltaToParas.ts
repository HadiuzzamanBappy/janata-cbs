import { ALIGN_MAP } from "../constants/alignment";
import { QUILL_FONT_MAP, QUILL_SIZE_MAP } from "../constants/quill";
import type { Align, Font } from "../types/primitives";
import type { Paragraph, ParagraphRun } from "../types/text-block";
import { uid } from "../utils/id";

/**
 * Convert a Quill Delta (`{ ops: [...] }`) into the `Paragraph[]` model the
 * PDF renderer consumes.
 *
 * Behaviour preserved from the monolith:
 *  - One paragraph = one Quill line (separated by `"\n"` text inserts).
 *  - Block-level attributes (align, …) live on the trailing `"\n"` insert.
 *  - Inline attributes (bold, italic, color, size, font) live on text inserts.
 *  - Each Quill op becomes a `ParagraphRun` with its own inline styles so the
 *    PDF renderer can render mixed-format lines correctly (per-run font size,
 *    bold, colour, etc.).  The paragraph-level `fontSize` / `bold` / `italic`
 *    are still set from the first run for backwards-compat with code that
 *    doesn't inspect `inlineRuns`.
 *  - Table embeds become a single paragraph with `isTable: true` and a
 *    `tableData: string[][]` payload. Two embed shapes are handled:
 *      a. the modern `table-embed` insert with `{ rows, html }` payload,
 *      b. the legacy `table-cell-line` block attribute (quill-better-table).
 *  - Trailing empty paragraphs Quill appends are stripped.
 *
 * Re-exported `QUILL_SIZE_MAP.normal = 13` is the studio's default font
 * size — see CRITICAL DETAIL #13.
 */

/** Parse a Quill size attribute value to a numeric pt size. */
function parseSize(raw: any): number | undefined {
  if (raw == null || raw === false || raw === "") return undefined;
  if (typeof raw === "number") return raw;
  const s = String(raw);
  // Style-based attributor stores "12px" — strip units (px ≈ pt at 96dpi/72pt,
  // but the studio treats them as equivalent for simplicity).
  if (/^\d+(\.\d+)?px$/.test(s)) return parseFloat(s);
  // Class-based attributor stores named keys: "small" | "large" | "huge"
  if (QUILL_SIZE_MAP[s] != null) return QUILL_SIZE_MAP[s];
  return undefined;
}

/** Build a ParagraphRun from a raw Quill run (text + attrs). */
function buildRun(text: string, attrs: Record<string, any>): ParagraphRun {
  const run: ParagraphRun = { text };
  const sz = parseSize(attrs.size);
  if (sz != null) run.fontSize = sz;
  if (attrs.bold) run.bold = true;
  if (attrs.italic) run.italic = true;
  if (attrs.underline) run.underline = true;
  if (attrs.color) run.color = attrs.color as string;
  if (attrs.font) {
    const mapped = QUILL_FONT_MAP[(attrs.font as string).toLowerCase()];
    if (mapped) run.font = mapped;
  }
  return run;
}

export function deltaToParas(delta: any): Paragraph[] {
  if (!delta || !Array.isArray(delta.ops)) return [];
  const ops = delta.ops as Array<{ insert: any; attributes?: Record<string, any> }>;

  const result: Paragraph[] = [];

  type LineAcc = {
    runs: { text: string; attrs: Record<string, any> }[];
    blockAttrs: Record<string, any>;
  };
  let lines: LineAcc[] = [{ runs: [], blockAttrs: {} }];

  const flushLines = () => {
    // Drop the trailing-empty-line Quill always appends.
    if (lines.length > 0) {
      const last = lines[lines.length - 1];
      if (last.runs.length === 0 && Object.keys(last.blockAttrs).length === 0) {
        lines.pop();
      }
    }

    let tableRowMap: Map<string, string[]> = new Map();
    let inTable = false;

    const flushTableGroup = () => {
      if (!inTable || tableRowMap.size === 0) return;
      const tableData = Array.from(tableRowMap.values());
      result.push({
        _id: uid(),
        text: tableData.map((r) => r.join(" | ")).join("\n"),
        font: "HELVETICA",
        bold: false,
        italic: false,
        underline: false,
        fontSize: 9,
        fontColor: "#374151",
        align: "LEFT",
        spacingAfter: 6,
        lineHeight: 1.4,
        isTable: true,
        tableData,
      });
      tableRowMap = new Map();
      inTable = false;
    };

    for (const line of lines) {
      const cellAttr = line.blockAttrs?.["table-cell-line"];
      if (cellAttr) {
        inTable = true;
        const rowId = cellAttr.row || "r0";
        const cellText = line.runs
          .map((r) => r.text)
          .join("")
          .trim();
        if (!tableRowMap.has(rowId)) tableRowMap.set(rowId, []);
        tableRowMap.get(rowId)!.push(cellText);
      } else {
        flushTableGroup();

        // Build per-run inline style objects from every Quill op in this line
        const inlineRuns: ParagraphRun[] = line.runs.map((r) => buildRun(r.text, r.attrs));

        // Paragraph-level attrs come from the FIRST run that has each property
        // (backwards-compat for renderers that don't inspect inlineRuns).
        const text = inlineRuns.map((r) => r.text).join("");
        const ba = line.blockAttrs;

        // fontSize: first run with an explicit size wins; fall back to default
        const firstSized = inlineRuns.find((r) => r.fontSize != null);
        const fontSize = firstSized?.fontSize ?? QUILL_SIZE_MAP.normal;

        // font: first run with an explicit font wins
        const firstFonted = inlineRuns.find((r) => r.font != null);
        const font: Font = firstFonted?.font ?? "HELVETICA";

        // Bold / italic / underline / color from first run (legacy compat)
        const fa = line.runs[0]?.attrs || {};

        result.push({
          _id: uid(),
          text,
          font,
          bold: !!fa.bold,
          italic: !!fa.italic,
          underline: !!fa.underline,
          fontSize,
          fontColor: (fa.color as string) || "#374151",
          align: (ALIGN_MAP[ba.align || "left"] || "LEFT") as Align,
          spacingAfter: 0,
          lineHeight: 1.6,
          inlineRuns,
        });
      }
    }
    flushTableGroup();
    lines = [{ runs: [], blockAttrs: {} }];
  };

  for (const op of ops) {
    if (typeof op.insert === "string") {
      const parts = op.insert.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) {
          lines[lines.length - 1].blockAttrs = op.attributes || {};
          lines.push({ runs: [], blockAttrs: {} });
        }
        if (part.length > 0) {
          lines[lines.length - 1].runs.push({
            text: part,
            attrs: op.attributes || {},
          });
        }
      });
    } else if (op.insert && typeof op.insert === "object") {
      if (op.insert["table-embed"]) {
        // Flush accumulated text lines before inserting the table.
        flushLines();
        const val = op.insert["table-embed"];
        // Prefer the structured `{ rows }` payload; fall back to HTML parsing.
        const tableData: string[][] =
          val?.rows && Array.isArray(val.rows)
            ? val.rows
            : (() => {
                const html: string = typeof val === "string" ? val : val?.html || "";
                if (!html) return [];
                const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
                return rowMatches.map((rowHtml) => {
                  const cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
                  return cellMatches.map((cell) =>
                    cell
                      .replace(/<[^>]+>/g, "")
                      .replace(/&nbsp;/g, " ")
                      .replace(/&amp;/g, "&")
                      .trim(),
                  );
                });
              })();

        if (tableData.length > 0) {
          result.push({
            _id: uid(),
            text: tableData.map((r) => r.join(" | ")).join("\n"),
            font: "HELVETICA",
            bold: false,
            italic: false,
            underline: false,
            fontSize: 9,
            fontColor: "#374151",
            align: "LEFT",
            spacingAfter: 6,
            lineHeight: 1.4,
            isTable: true,
            tableData,
            tableStyle: val?.tableStyle || null,
          });
        }
      } else {
        const tokenVal = op.insert["variable-token"] || op.insert.image;
        if (tokenVal) {
          lines[lines.length - 1].runs.push({
            text: String(tokenVal),
            attrs: op.attributes || {},
          });
        }
      }
    }
  }

  // Flush any remaining text lines
  flushLines();

  return result.filter((p) => p.isTable || (p.text || "").trim().length > 0 || result.length === 1);
}
