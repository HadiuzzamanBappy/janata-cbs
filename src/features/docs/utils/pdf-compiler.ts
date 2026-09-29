import { pdf } from "@react-pdf/renderer";
import React from "react";
import { PortalPdfDoc } from "../components/pdf/portal-pdf-doc";
import type { PdfGenerationProgress, PdfGenerationResult, PortalDocsBundle } from "../types";

/**
 * Pure compiler utility to render a PortalDocsBundle into a vector PDF Blob using @react-pdf/renderer.
 */
export async function compilePortalPdf(
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

  const doc = React.createElement(PortalPdfDoc, { bundle });
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();

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