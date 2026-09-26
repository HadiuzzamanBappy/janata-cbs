import { Document, Image, Page, pdf, Text, View } from "@react-pdf/renderer";
import type { PortalDocsBundle } from "../actions/fetch-portal-docs";
import { pdfStyles } from "../styles/pdf-styles";

export interface PdfGenerationProgress {
  stage: string;
  percent: number;
}

export interface PdfGenerationResult {
  blob: Blob;
  fileName: string;
  save: () => void;
}

// Optional logo path resolved relative to domain/public assets
const APP_LOGO_SRC = "/icon.png";

/**
 * Parses inline formatting (**bold** and `code` badges) into native @react-pdf/renderer Text nodes.
 * Uses content-derived keys instead of array indices.
 */
function renderInlinePdfText(text: string, keyPrefix: string = "inl") {
  // Strip emojis to prevent glyph encoding overlap in standard PDF fonts
  const cleanText = text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
    .trim();
  const parts = cleanText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  let inlineCounter = 0;

  return parts.map((part) => {
    inlineCounter++;
    const partSlug = part.slice(0, 16).replace(/[^\w-]/g, "_");
    const key = `inline-${keyPrefix}-t${inlineCounter}-${partSlug}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={key} style={pdfStyles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={key} style={pdfStyles.codeBadge}>
          {` ${part.slice(1, -1)} `}
        </Text>
      );
    }
    return part;
  });
}

/**
 * Parses markdown block elements into vector React-PDF components.
 * Uses content-derived keys instead of array indices.
 */
function renderMarkdownPdfBlocks(content: string, itemKeyPrefix: string = "doc") {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = (tableId: string) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1);
    let colCounter = 0;
    let rowCounter = 0;

    elements.push(
      <View key={`tbl-${itemKeyPrefix}-${tableId}`} style={pdfStyles.table}>
        {header && (
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeaderRow]}>
            {header.map((cell) => {
              colCounter++;
              const cellSlug = cell
                .trim()
                .slice(0, 15)
                .replace(/[^\w-]/g, "_");
              return (
                <Text
                  key={`th-${itemKeyPrefix}-${tableId}-c${colCounter}-${cellSlug}`}
                  style={pdfStyles.tableCellHeader}
                >
                  {renderInlinePdfText(cell.trim(), `th-${tableId}-c${colCounter}`)}
                </Text>
              );
            })}
          </View>
        )}
        {body.map((row) => {
          rowCounter++;
          let cellCounter = 0;
          const rowSlug = row
            .join("_")
            .slice(0, 20)
            .replace(/[^\w-]/g, "_");
          const rowKey = `tr-${itemKeyPrefix}-${tableId}-r${rowCounter}-${rowSlug}`;
          return (
            <View key={rowKey} style={pdfStyles.tableRow}>
              {row.map((cell) => {
                cellCounter++;
                const cellSlug = cell
                  .trim()
                  .slice(0, 15)
                  .replace(/[^\w-]/g, "_");
                return (
                  <Text
                    key={`td-${rowKey}-c${cellCounter}-${cellSlug}`}
                    style={pdfStyles.tableCell}
                  >
                    {renderInlinePdfText(cell.trim(), `${rowKey}-c${cellCounter}`)}
                  </Text>
                );
              })}
            </View>
          );
        })}
      </View>,
    );
    tableRows = [];
    inTable = false;
  };

  let codeBlockLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const line = rawLine.trim();
    const lineSlug = line.slice(0, 16).replace(/[^\w-]/g, "_");
    const lineKey = `block-${itemKeyPrefix}-L${i}-${lineSlug}`;

    // Code Block Detection (```)
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <View key={`code-${lineKey}`} style={pdfStyles.codeBlock}>
            <Text style={pdfStyles.codeBlockText}>{codeBlockLines.join("\n")}</Text>
          </View>,
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        if (inTable) flushTable(lineKey);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Table Row Detection
    if (line.startsWith("|") && line.endsWith("|")) {
      if (line.includes("---")) {
        continue;
      }
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    }

    if (inTable && !line.startsWith("|")) {
      flushTable(lineKey);
    }

    if (!line) continue;

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <Text key={lineKey} style={pdfStyles.h1}>
          {renderInlinePdfText(line.slice(2), lineKey)}
        </Text>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <Text key={lineKey} style={pdfStyles.h2}>
          {renderInlinePdfText(line.slice(3), lineKey)}
        </Text>,
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <Text key={lineKey} style={pdfStyles.h3}>
          {renderInlinePdfText(line.slice(4), lineKey)}
        </Text>,
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <View key={lineKey} style={pdfStyles.blockquote}>
          <Text style={pdfStyles.blockquoteText}>
            {renderInlinePdfText(line.slice(2), lineKey)}
          </Text>
        </View>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <View key={lineKey} style={pdfStyles.listRow}>
          <Text style={pdfStyles.bulletDot}>•</Text>
          <Text style={pdfStyles.listText}>{renderInlinePdfText(line.slice(2), lineKey)}</Text>
        </View>,
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s+(.*)/);
      if (match) {
        elements.push(
          <View key={lineKey} style={pdfStyles.listRow}>
            <Text style={pdfStyles.bulletDot}>{match[1]}</Text>
            <Text style={pdfStyles.listText}>{renderInlinePdfText(match[2]!, lineKey)}</Text>
          </View>,
        );
      }
    } else {
      elements.push(
        <Text key={lineKey} style={pdfStyles.paragraph}>
          {renderInlinePdfText(line, lineKey)}
        </Text>,
      );
    }
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <View key={`code-${itemKeyPrefix}-final`} style={pdfStyles.codeBlock}>
        <Text style={pdfStyles.codeBlockText}>{codeBlockLines.join("\n")}</Text>
      </View>,
    );
  }

  if (inTable) {
    flushTable("final");
  }

  return elements;
}

/**
 * Root Vector PDF Document Component
 */
function PortalPdfDocument({ bundle }: { bundle: PortalDocsBundle }) {
  return (
    <Document title={bundle.portalTitle} author="Janata CBS Platform">
      {/* Cover Page */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.coverPage}>
          <Image src={APP_LOGO_SRC} style={pdfStyles.coverLogo} />
          <Text style={pdfStyles.coverSub}>Janata CBS Core Banking Workbench</Text>
          <Text style={pdfStyles.coverTitle}>{bundle.portalTitle}</Text>
          <Text style={pdfStyles.coverDate}>Generated on: {bundle.generatedAt}</Text>
          <Text style={pdfStyles.coverBadge}>Official Dynamic Export</Text>
        </View>
      </Page>

      {/* Table of Contents Page */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBadge}>
          <Text style={pdfStyles.headerPath}>docs/sitemap.md</Text>
          <Text style={pdfStyles.headerMeta}>Table of Contents</Text>
        </View>
        <Text style={pdfStyles.h2}>Portal Sitemap & Index</Text>
        {bundle.items.map((item) => (
          <View key={`toc-${item.href}`} style={pdfStyles.listRow}>
            <Text style={pdfStyles.bulletDot}>•</Text>
            <Text style={pdfStyles.listText}>
              <Text style={pdfStyles.bold}>[{item.sectionTitle}]</Text> {item.itemTitle}
            </Text>
          </View>
        ))}
        <View style={pdfStyles.footer} fixed>
          <Text>Janata CBS Documentation</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Chapter Sections */}
      {bundle.items.map((item, itemIdx) => {
        const sectionNum = itemIdx + 1;
        return (
          <Page key={`chapter-${item.href}`} size="A4" style={pdfStyles.page} wrap>
            <View style={pdfStyles.headerBadge}>
              <Text style={pdfStyles.headerPath}>
                {item.href.startsWith("/manual") ? "manual/" : "devs/"}
                {item.itemTitle}
              </Text>
              <Text style={pdfStyles.headerMeta}>
                Section {sectionNum} of {bundle.items.length}
              </Text>
            </View>
            <Text style={pdfStyles.sectionTitle}>{item.sectionTitle}</Text>
            {renderMarkdownPdfBlocks(item.content, item.href.replace(/[^\w-]/g, "_"))}
            <View style={pdfStyles.footer} fixed>
              <Text>{bundle.portalTitle}</Text>
              <Text
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

/**
 * Client utility to render a PortalDocsBundle into a 100% native vector PDF using @react-pdf/renderer.
 */
export async function generatePortalPdf(
  bundle: PortalDocsBundle,
  onProgress?: (progress: PdfGenerationProgress) => void,
): Promise<PdfGenerationResult> {
  onProgress?.({
    stage: "Parsing markdown into vector PDF document structure...",
    percent: 30,
  });

  onProgress?.({
    stage: "Compiling native vector pages & pagination...",
    percent: 65,
  });

  const doc = <PortalPdfDocument bundle={bundle} />;
  const blob = await pdf(doc).toBlob();

  onProgress?.({
    stage: "Vector PDF Compiled Successfully!",
    percent: 100,
  });

  const fileName = `${bundle.portalTitle.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;

  const save = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return { blob, fileName, save };
}
