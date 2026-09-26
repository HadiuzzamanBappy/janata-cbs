"use client";

import { CheckCircle2, Download, FileText, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchAllPortalDocsAction } from "../actions/fetch-portal-docs";
import type { NavGroup } from "../config/types";
import { generatePortalPdf, type PdfGenerationResult } from "../utils/pdf-generator";

export interface DocPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portalSubFolder: string;
  portalTitle: string;
  navGroups?: NavGroup[];
}

export function DocPdfModal({
  open,
  onOpenChange,
  portalSubFolder,
  portalTitle,
}: DocPdfModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [stageText, setStageText] = useState("Initializing PDF Exporter...");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfGenerationResult | null>(null);

  const startPdfExport = useCallback(async () => {
    setIsGenerating(true);
    setIsCompleted(false);
    setErrorText(null);
    setPdfResult(null);
    setProgressPercent(10);
    setStageText("Fetching portal documentation from server...");

    try {
      // Step 1: Fetch all portal docs via server action
      const bundle = await fetchAllPortalDocsAction(portalSubFolder);
      setProgressPercent(30);

      // Step 2: Compile vector PDF client-side without auto-saving
      const result = await generatePortalPdf(bundle, (prog) => {
        setStageText(prog.stage);
        setProgressPercent(prog.percent);
      });

      setPdfResult(result);
      setIsCompleted(true);
      setIsGenerating(false);
    } catch (err: unknown) {
      console.error("PDF generation error:", err);
      setErrorText(err instanceof Error ? err.message : "Failed to generate PDF manual.");
      setIsGenerating(false);
    }
  }, [portalSubFolder]);

  // Smooth UI flow: Open modal UI first, then start processing after 350ms transition
  useEffect(() => {
    if (open && !isGenerating && !isCompleted && !errorText && !pdfResult) {
      const timer = setTimeout(() => {
        startPdfExport();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, isGenerating, isCompleted, errorText, pdfResult, startPdfExport]);

  const handleDownloadClick = () => {
    if (pdfResult) {
      pdfResult.save();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl space-y-6 text-card-foreground select-none relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Export Dynamic PDF Manual</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{portalTitle}</p>
          </div>
        </div>

        {/* Status & Progress Section */}
        {errorText ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-3">
            <p className="font-semibold text-sm">Generation Failed</p>
            <p className="leading-relaxed opacity-90">{errorText}</p>
            <button
              type="button"
              onClick={startPdfExport}
              className="inline-flex items-center justify-center px-4 py-2 bg-destructive text-white hover:bg-destructive/90 rounded-md text-xs font-semibold cursor-pointer shadow-xs transition"
            >
              Retry Export
            </button>
          </div>
        ) : isCompleted ? (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Vector PDF Compilation Complete!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your native vector PDF is compiled and ready for download.
              </p>
            </div>

            {/* Prominent Centered Download Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleDownloadClick}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs transition cursor-pointer shadow-md active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Manual</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar Container */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground truncate max-w-[260px]">{stageText}</span>
                <span className="text-primary font-mono font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">1. Fetching documentation content</span>
                {progressPercent >= 30 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">2. Building PDF cover & layout</span>
                {progressPercent >= 65 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : progressPercent >= 30 ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">3. Compiling native vector pages</span>
                {progressPercent >= 100 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : progressPercent >= 65 ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer: Hidden when completed */}
        {!isCompleted && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
