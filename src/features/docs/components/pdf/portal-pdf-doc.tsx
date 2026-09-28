import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type React from "react";
import type { PortalDocsBundle } from "../../types";
import { pdfStyles } from "./pdf-styles";

const APP_LOGO_SRC = "/icon.png";

/**
 * Parses inline formatting (**bold** and `code` badges) into native @react-pdf/renderer Text nodes.
 */
function renderInlinePdfText(text: string, keyPrefix: string = "inl") {
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

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <View key={`code-${lineKey}`} style={pdfStyles.codeBlock}>
            <Text style={pdfStyles.codeBlockText}>{codeBlockLines.join("\n")}</Text>
          </View>,
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        if (inTable) flushTable(lineKey);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

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

    if (line.startsWith("# ")) {
      elements.push(
        <Text key={`h1-${lineKey}`} style={pdfStyles.h1}>
          {line.replace(/^#\s+/, "")}
        </Text>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <Text key={`h2-${lineKey}`} style={pdfStyles.h2}>
          {line.replace(/^##\s+/, "")}
        </Text>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <Text key={`h3-${lineKey}`} style={pdfStyles.h3}>
          {line.replace(/^###\s+/, "")}
        </Text>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      elements.push(
        <View key={`quote-${lineKey}`} style={pdfStyles.blockquote}>
          <Text style={pdfStyles.blockquoteText}>
            {renderInlinePdfText(line.replace(/^>\s+/, ""), `quote-${lineKey}`)}
          </Text>
        </View>,
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <View key={`li-${lineKey}`} style={pdfStyles.listRow}>
          <Text style={pdfStyles.bulletDot}>•</Text>
          <Text style={pdfStyles.listText}>
            {renderInlinePdfText(line.replace(/^[-*]\s+/, ""), `li-${lineKey}`)}
          </Text>
        </View>,
      );
      continue;
    }

    if (line.trim().length > 0) {
      elements.push(
        <Text key={`p-${lineKey}`} style={pdfStyles.paragraph}>
          {renderInlinePdfText(line, `p-${lineKey}`)}
        </Text>,
      );
    }
  }

  if (inTable) {
    flushTable("eof");
  }

  return elements;
}

export interface PortalPdfDocProps {
  bundle: PortalDocsBundle;
}

export function PortalPdfDoc({ bundle }: PortalPdfDocProps) {
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
