"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useImperativeHandle,
} from "react";
import {
  X,
  FileJson,
  ZoomIn,
  ZoomOut,
  LayoutTemplate,
  PanelTop,
  PanelBottom,
  Settings2,
  Plus,
  Trash2,
  RotateCw,
  Maximize2,
  Palette,
  Copy,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Database,
  ChevronDown,
  Crosshair,
  LayoutGrid,
  FileImage,
  Pin,
  Hash,
  Save,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Chart.js registration side-effect
import "@/features/system/report-studio/lib/chart-register";

// Types (relative — @types/* is reserved by TS)
import type {
  AppState,
  Sel,
  LeftTab,
  CtxMenu,
  BodyCtxMenu,
} from "@/features/system/report-studio/types/app-state";
import type {
  ZoneElement,
  ZoneRow,
} from "@/features/system/report-studio/types/zone";
import type {
  BodyComponent,
  BodyRow,
  BodyCompType,
} from "@/features/system/report-studio/types/body";

// Studio internals
import { undoReducer } from "./reducer";
import type { UndoState } from "./reducer";
import { INITIAL_STATE } from "./initial-state";

// Utils
import { deepClone } from "@/features/system/report-studio/utils/deepClone";
import { uid as generateId } from "@/features/system/report-studio/utils/id";
import { buildReportJson } from "@/features/system/report-studio/utils/buildReportJson";
import { getPageWidthMm } from "@/features/system/report-studio/utils/units";

// Constants & theme
import {
  PALETTE,
  SAMPLE_DATA_BY_TYPE,
  makeDefaultTableColumns,
  ReportTemplate,
} from "@/features/system/report-studio/constants/preview-data";
import type { Theme } from "@/features/system/report-studio/theme/themes";
import { T } from "@/features/system/report-studio/theme/tokens";
import { BODY_COMP_META } from "@/features/system/report-studio/features/body/meta";

// Canvas
import { BandCanvas } from "@/features/system/report-studio/canvas/BandCanvas";
import { BodyCanvas } from "@/features/system/report-studio/canvas/BodyCanvas";

// PDF
import { PdfPreviewModal } from "@/features/system/report-studio/pdf/PdfPreviewModal";

// Feature panels
import { ElementListPanel } from "@/features/system/report-studio/features/zones/ElementListPanel";
import { ElementPropsPanel } from "@/features/system/report-studio/features/zones/ElementPropsPanel";
import { ZoneStylePanel } from "@/features/system/report-studio/features/zones/ZoneStylePanel";
import { MultiSelectPanel } from "@/features/system/report-studio/features/zones/MultiSelectPanel";
import { ZoneRowPropsPanel } from "@/features/system/report-studio/features/zones/ZoneRowPropsPanel";
import { BodyComponentListPanel } from "@/features/system/report-studio/features/body/BodyComponentListPanel";
import { BodyCompPropsPanel } from "@/features/system/report-studio/features/body/BodyCompPropsPanel";
import { BodyRowPropsPanel } from "@/features/system/report-studio/features/body/BodyRowPropsPanel";
import { PageSetupPanel } from "@/features/system/report-studio/features/page-setup/PageSetupPanel";
import { ThemesPicker } from "@/features/system/report-studio/features/templates/ThemesPicker";
import { TemplateModal } from "@/features/system/report-studio/features/templates/TemplateModal";
import { JsonExportModal } from "@/features/system/report-studio/features/import-export/JsonExportModal";
import { ImportJsonModal } from "@/features/system/report-studio/features/import-export/ImportJsonModal";
import { ZoneContextMenu as ContextMenu } from "@/features/system/report-studio/features/context-menu/ZoneContextMenu";
import { BodyContextMenu } from "@/features/system/report-studio/features/context-menu/BodyContextMenu";

export interface ReportStudioProps {
  rptConfig?: object;
  height?: number | string;
  width?: number | string;
  dataFetcher?: () => Promise<Record<string, any[]>>;
  onDataError?: (error: Error) => void;
}

export type rptDesignRef = {
  getConfigData: () => AppState;
};

const ReportStudio = React.forwardRef<rptDesignRef, ReportStudioProps>(
  (props, ref) => {
    const { height, width, dataFetcher, onDataError, rptConfig } = props;

    // Deep-merge rptConfig on top of INITIAL_STATE so page/header/footer
    // always exist even when rptConfig is partial or missing fields.
    const mergedInitial: AppState = rptConfig
      ? {
        ...deepClone(INITIAL_STATE),
        ...(rptConfig as Partial<AppState>),
        page: {
          ...deepClone(INITIAL_STATE).page,
          ...((rptConfig as any).page ?? {}),
          header: {
            ...deepClone(INITIAL_STATE).page.header,
            ...((rptConfig as any).page?.header ?? {}),
          },
          footer: {
            ...deepClone(INITIAL_STATE).page.footer,
            ...((rptConfig as any).page?.footer ?? {}),
          },
        },
        bodyRows:
          (rptConfig as any).bodyRows ?? deepClone(INITIAL_STATE).bodyRows,
        bodyComponents:
          (rptConfig as any).bodyComponents ??
          deepClone(INITIAL_STATE).bodyComponents,
      }
      : deepClone(INITIAL_STATE);

    const [undoState, dispatch] = React.useReducer(undoReducer, {
      past: [],
      present: mergedInitial,
      future: [],
    } as UndoState);
    const reportState = undoState.present;
    const histLen = undoState.past.length;
    const futLen = undoState.future.length;
    const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
    const [bodyCtxMenu, setBodyCtxMenu] = useState<BodyCtxMenu | null>(null);
    const [showThemes, setShowThemes] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const handlePrintPDF = async () => {
      if (dataFetcher) {
        try {
          setIsLoadingData(true);
          const actualData = await dataFetcher();
          dispatch({
            type: "SET_SILENT",
            fn: (s) => {
              s.centralData = { ...(s.centralData || {}), ...actualData };
            },
          });
          setIsLoadingData(false);
          setShowPdfModal(true);
        } catch (error) {
          setIsLoadingData(false);
          console.error("Error fetching report data:", error);
          if (onDataError) {
            onDataError(error as Error);
          } else {
            alert("Error loading report data: " + (error as Error).message);
          }
        }
      } else {
        setShowPdfModal(true);
      }
    };

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [selection, setSelection] = useState<Sel>(null);
    const [canvasZoom, setCanvasZoom] = useState(1.0);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [snapGrid, setSnapGrid] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dismissedHints, setDismissedHints] = useState<
      Record<string, boolean>
    >({});
    const dismissHint = (id: string) =>
      setDismissedHints((p) => ({ ...p, [id]: true }));

    const [headerAddRowOpen, setHeaderAddRowOpen] = useState(false);
    const [headerAddRowCols, setHeaderAddRowCols] = useState<1 | 2 | 3 | 4>(2);
    const [footerAddRowOpen, setFooterAddRowOpen] = useState(false);
    const [footerAddRowCols, setFooterAddRowCols] = useState<1 | 2 | 3 | 4>(2);
    const [headerSelectedRowId, setHeaderSelectedRowId] = useState<
      string | null
    >(null);
    const [headerSelectedCol, setHeaderSelectedCol] = useState<number>(1);
    const [footerSelectedRowId, setFooterSelectedRowId] = useState<
      string | null
    >(null);
    const [footerSelectedCol, setFooterSelectedCol] = useState<number>(1);

    const fitToScreen = useCallback(() => {
      const el = canvasContainerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const padW = 56,
        padH = 80;
      const landscape = reportState.page.orientation === "landscape";
      const pgW = landscape ? 842 : 595;
      const pgH = landscape ? 595 : 842;
      const zW = (width - padW) / pgW;
      const zH = (height - padH) / pgH;
      setCanvasZoom(+Math.min(zW, zH, 2.5).toFixed(2));
    }, [reportState.page.orientation]);

    useEffect(() => {
      const timer = setTimeout(() => {
        fitToScreen();
      }, 100);
      const handleResize = () => {
        fitToScreen();
      };
      window.addEventListener("resize", handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
      };
    }, [fitToScreen]);

    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [hoveredTab, setHoveredTab] = useState<LeftTab | null>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<LeftTab>("page");
    const headerBandRef = useRef<HTMLDivElement>(null);
    const footerBandRef = useRef<HTMLDivElement>(null);
    const [headerBandHeight, setHeaderBandHeight] = useState(0);
    const [footerBandHeight, setFooterBandHeight] = useState(0);

    useEffect(() => {
      const measure = () => {
        requestAnimationFrame(() => {
          if (headerBandRef.current)
            setHeaderBandHeight(
              headerBandRef.current.getBoundingClientRect().height
            );
          if (footerBandRef.current)
            setFooterBandHeight(
              footerBandRef.current.getBoundingClientRect().height
            );
        });
      };
      measure();
      const ro = new ResizeObserver(measure);
      if (headerBandRef.current) ro.observe(headerBandRef.current);
      if (footerBandRef.current) ro.observe(footerBandRef.current);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasZoom]);

    useEffect(() => {
      requestAnimationFrame(() => {
        if (headerBandRef.current)
          setHeaderBandHeight(
            headerBandRef.current.getBoundingClientRect().height
          );
        if (footerBandRef.current)
          setFooterBandHeight(
            footerBandRef.current.getBoundingClientRect().height
          );
      });
    }, [reportState]);

    const mutateState = useCallback(
      (fn: (s: AppState) => void) => dispatch({ type: "SET", fn }),
      []
    );
    const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
    const redo = useCallback(() => dispatch({ type: "REDO" }), []);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        const inInput =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
        if (!inInput && e.key === "f") {
          e.preventDefault();
          fitToScreen();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          dispatch({ type: "UNDO" });
        }
        if (
          (e.metaKey || e.ctrlKey) &&
          (e.key === "y" || (e.key === "z" && e.shiftKey))
        ) {
          e.preventDefault();
          dispatch({ type: "REDO" });
        }
        if (!inInput && (e.key === "Delete" || e.key === "Backspace")) {
          if (selection?.type === "element") {
            e.preventDefault();
            deleteZoneElement((selection as any).zone, selection.id);
          }
          if (selection?.type === "bodycomp") {
            e.preventDefault();
            deleteBodyComp(selection.id);
          }
          if (selection?.type === "bodyrow") {
            e.preventDefault();
            deleteBodyRow(selection.id);
          }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [selection]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedElement = useMemo(
      () =>
        selection?.type !== "element"
          ? null
          : (reportState.page as any)[(selection as any).zone]?.elements?.find(
            (e: ZoneElement) => e._id === selection.id
          ) || null,
      [selection, reportState]
    );

    const updateZoneElement = (zone: "header" | "footer", upd: ZoneElement) =>
      mutateState((s) => {
        const i = s.page[zone].elements.findIndex((e) => e._id === upd._id);
        if (i >= 0) s.page[zone].elements[i] = upd;
      });
    const updateZoneElementSilent = useCallback(
      (zone: "header" | "footer", upd: ZoneElement) => {
        dispatch({
          type: "SET_SILENT",
          fn: (s: AppState) => {
            const i = s.page[zone].elements.findIndex((e) => e._id === upd._id);
            if (i >= 0) s.page[zone].elements[i] = upd;
          },
        });
      },
      []
    );
    const commitZoneElementDrag = useCallback(
      (zone: "header" | "footer", upd: ZoneElement) => {
        dispatch({
          type: "SET",
          fn: (s: AppState) => {
            const i = s.page[zone].elements.findIndex((e) => e._id === upd._id);
            if (i >= 0) s.page[zone].elements[i] = upd;
          },
        });
      },
      []
    );
    const deleteZoneElement = (zone: "header" | "footer", id: string) => {
      mutateState((s) => {
        s.page[zone].elements = s.page[zone].elements.filter(
          (e) => e._id !== id
        );
      });
      setSelection({ type: "zone", zone });
    };
    const reorderZoneElements = (
      zone: "header" | "footer",
      els: ZoneElement[]
    ) =>
      mutateState((s) => {
        s.page[zone].elements = els;
      });
    const duplicateZoneElement = (zone: "header" | "footer", id: string) => {
      const el = reportState.page[zone].elements.find((e) => e._id === id);
      if (!el) return;
      const newEl: ZoneElement = {
        ...deepClone(el),
        _id: generateId(),
        config: {
          ...deepClone(el.config),
          x: (el.config.x || 0) + 5,
          y: (el.config.y || 0) + 5,
        },
      };
      mutateState((s) => {
        s.page[zone].elements.push(newEl);
      });
      setSelection({ type: "element", zone, id: newEl._id });
    };
    const zOrderZoneElement = (
      zone: "header" | "footer",
      id: string,
      dir: "up" | "down"
    ) => {
      mutateState((s) => {
        const els = s.page[zone].elements;
        const el = els.find((e) => e._id === id);
        if (!el) return;
        const baseZ = els.indexOf(el);
        const cur = el.zIndex ?? baseZ;
        el.zIndex = dir === "up" ? cur + 1 : Math.max(0, cur - 1);
      });
    };
    const toggleElementHidden = (zone: "header" | "footer", id: string) =>
      mutateState((s) => {
        const el = s.page[zone].elements.find((e) => e._id === id);
        if (el) el.hidden = !el.hidden;
      });
    const toggleElementLocked = (zone: "header" | "footer", id: string) =>
      mutateState((s) => {
        const el = s.page[zone].elements.find((e) => e._id === id);
        if (el) el.locked = !el.locked;
      });

    const resetToDefault = () => {
      dispatch({ type: "RESET" });
      setSelection(null);
      setShowResetConfirm(false);
    };

    const applyTheme = (t: Theme) => {
      mutateState((s) => {
        s.page.header.background = t.headerBg;
        s.page.footer.background = t.headerBg;
        s.bodyComponents.forEach((c: BodyComponent) => {
          if (c.type === "TABLE" && c.tableStyle) {
            c.tableStyle.headerColor = t.tableHeader;
            c.tableStyle.borderColor = t.borderColor;
          }
        });
        (["header", "footer"] as const).forEach((zone) => {
          s.page[zone].elements.forEach((el: ZoneElement) => {
            if (el.type === "SEPARATOR") el.config.color = t.sepColor;
            if (el.type === "TEXT" || el.type === "DATE_TIME")
              el.config.fontColor =
                el.config.fontColor === s.page[zone].fontColor
                  ? t.headerFont
                  : el.config.fontColor;
          });
          s.page[zone].fontColor = t.headerFont;
        });
      });
      setShowThemes(false);
    };

    const applyTemplate = (t: ReportTemplate) => {
      mutateState((s) => {
        s.page.size = t.page.size;
        s.page.orientation = t.page
          .orientation as import("@/features/system/report-studio/types/report-page").PageOrientation;
        s.page.margin = { ...t.page.margin };
        s.page.header = {
          ...t.header,
          elements: (t.header.elements as any[]).map((el: any) => ({
            ...deepClone(el),
            _id: generateId(),
          })),
        };
        s.page.footer = {
          ...t.footer,
          elements: (t.footer.elements as any[]).map((el: any) => ({
            ...deepClone(el),
            _id: generateId(),
          })),
        };
      });
      setSelection(null);
      setActiveTab("header");
    };

    const DEFAULT_BODY_COMP: Record<BodyCompType, Partial<BodyComponent>> = {
      TABLE: {
        label: "Data Table",
        height: undefined,
        rowId: "",
        slotIndex: 0,
        tableColumns: [],
        tableStyle: undefined,
        tableOddRowBg: "#f8fafc",
      },
      CHART: {
        label: "New Chart",
        height: 60,
        chartType: "bar",
        chartTitle: "",
        chartTitleFontSize: 12,
        chartTitleBold: true,
        chartTitleItalic: false,
        chartTitleColor: "#1e293b",
        chartTitleAlign: "center",
        chartSeries: [
          { label: "Value", dataKey: "value", color: "#2563eb" },
          { label: "Target", dataKey: "target", color: "#059669" },
        ],
        chartCategories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        chartShowLegend: true,
        chartShowGrid: true,
        chartShowScale: true,
        chartShowValues: false,
        chartLabelKey: "category",
        chartBg: "#ffffff",
        rowId: "",
        slotIndex: 0,
      },
      IMAGE: {
        label: "New Image",
        height: 60,
        imagePath: "",
        imageWidth: 80,
        imageHeight: 60,
        imageAlign: "CENTER",
        imageRotation: 0,
        imageOpacity: 1,
        imageCaption: "",
        rowId: "",
        slotIndex: 0,
      },
      TEXT_BLOCK: {
        label: "Text Block",
        height: undefined,
        paragraphs: [
          {
            _id: generateId(),
            text: "Your text here. Use {{variable}} for dynamic data.",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 10,
            fontColor: "#374151",
            align: "LEFT",
            spacingAfter: 4,
          },
        ],
        textBg: "transparent",
        textPadding: { top: 4, bottom: 4, left: 0, right: 0 },
        rowId: "",
        slotIndex: 0,
      },
    };

    const addBodyRow = (cols: number = 1) => {
      const row: BodyRow = {
        _id: generateId(),
        label: `Row ${(reportState.bodyRows || []).length + 1}`,
        cols,
        gap: 8,
        padding: { top: 4, bottom: 4, left: 0, right: 0 },
        margin: { top: 0, bottom: 8, left: 0, right: 0 },
      };
      mutateState((s) => {
        if (!s.bodyRows) s.bodyRows = [];
        s.bodyRows.push(row);
      });
      setSelection({ type: "bodyrow", id: row._id });
      setActiveTab("body");
      return row._id;
    };
    const updateBodyRow = (upd: BodyRow) =>
      mutateState((s) => {
        if (!s.bodyRows) return;
        const i = s.bodyRows.findIndex((r) => r._id === upd._id);
        if (i >= 0) s.bodyRows[i] = upd;
      });
    const deleteBodyRow = (id: string) => {
      mutateState((s) => {
        s.bodyRows = (s.bodyRows || []).filter((r) => r._id !== id);
        s.bodyComponents = s.bodyComponents.filter((c) => c.rowId !== id);
      });
      setSelection(null);
    };
    const reorderBodyRows = (rows: BodyRow[]) =>
      mutateState((s) => {
        s.bodyRows = rows;
      });
    const toggleBodyRowHidden = (id: string) =>
      mutateState((s) => {
        const r = (s.bodyRows || []).find((r) => r._id === id);
        if (r) r.hidden = !r.hidden;
      });
    const toggleBodyRowLocked = (id: string) =>
      mutateState((s) => {
        const r = (s.bodyRows || []).find((r) => r._id === id);
        if (r) r.locked = !r.locked;
      });

    const addBodyComp = (
      type: BodyCompType,
      rowId: string,
      slotIndex: number
    ) => {
      const comp: BodyComponent = {
        _id: generateId(),
        type,
        rowId,
        slotIndex,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        ...deepClone(DEFAULT_BODY_COMP[type]),
      } as BodyComponent;
      comp.rowId = rowId;
      comp.slotIndex = slotIndex;
      const sampleData = SAMPLE_DATA_BY_TYPE[type] || [];
      if (type === "TABLE" && sampleData.length > 0) {
        comp.tableColumns = makeDefaultTableColumns();
        comp.tableStyle = {
          borderWidth: 0.5,
          borderColor: "#e2e8f0",
          borderStyle: "solid",
          horizontalBorderOnly: false,
          verticalBorderOnly: false,
          headerBorder: true,
          headerColor: "#1e40af",
          dataBorder: true,
          consistentCellAlignment: false,
          cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
        };
        comp.tableOddRowBg = "#f8fafc";
      } else if (type === "TABLE") {
        comp.tableColumns = makeDefaultTableColumns();
        comp.tableStyle = {
          borderWidth: 0.5,
          borderColor: "#e2e8f0",
          borderStyle: "solid",
          horizontalBorderOnly: false,
          verticalBorderOnly: false,
          headerBorder: true,
          headerColor: "#1e40af",
          dataBorder: true,
          consistentCellAlignment: false,
          cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
        };
        comp.tableOddRowBg = "#f8fafc";
      }
      mutateState((s) => {
        s.bodyComponents.push(comp);
        if (sampleData.length > 0) {
          if (!s.componentDataSources) s.componentDataSources = {};
          s.componentDataSources[comp._id] = deepClone(sampleData);
        }
      });
      setSelection({ type: "bodycomp", id: comp._id });
      setActiveTab("body");
    };

    const moveBodyComp = (
      compId: string,
      targetRowId: string,
      targetSlot: number
    ) => {
      mutateState((s) => {
        const c = s.bodyComponents.find((c) => c._id === compId);
        if (!c) return;
        const existing = s.bodyComponents.find(
          (c) =>
            c.rowId === targetRowId &&
            c.slotIndex === targetSlot &&
            c._id !== compId
        );
        if (existing) {
          existing.rowId = c.rowId;
          existing.slotIndex = c.slotIndex;
        }
        c.rowId = targetRowId;
        c.slotIndex = targetSlot;
      });
    };
    const updateBodyComp = (upd: BodyComponent) =>
      mutateState((s) => {
        const i = s.bodyComponents.findIndex((c) => c._id === upd._id);
        if (i >= 0) s.bodyComponents[i] = upd;
      });
    const deleteBodyComp = (id: string) => {
      mutateState((s) => {
        s.bodyComponents = s.bodyComponents.filter((c) => c._id !== id);
      });
      setSelection(null);
    };
    const reorderBodyComps = (comps: BodyComponent[]) =>
      mutateState((s) => {
        s.bodyComponents = comps;
      });
    const toggleBodyHidden = (id: string) =>
      mutateState((s) => {
        const c = s.bodyComponents.find((c) => c._id === id);
        if (c) c.hidden = !c.hidden;
      });
    const toggleBodyLocked = (id: string) =>
      mutateState((s) => {
        const c = s.bodyComponents.find((c) => c._id === id);
        if (c) c.locked = !c.locked;
      });
    const duplicateBodyComp = (id: string) => {
      mutateState((s) => {
        const orig = s.bodyComponents.find((c) => c._id === id);
        if (!orig) return;
        const row = (s.bodyRows || []).find((r) => r._id === orig.rowId);
        if (!row) return;
        const usedSlots = s.bodyComponents
          .filter((c) => c.rowId === orig.rowId)
          .map((c) => c.slotIndex);
        let slot = -1;
        for (let i = 0; i < row.cols; i++) {
          if (!usedSlots.includes(i)) {
            slot = i;
            break;
          }
        }
        if (slot === -1) return;
        const clone = {
          ...deepClone(orig),
          _id: generateId(),
          label: orig.label + " (copy)",
          slotIndex: slot,
        };
        s.bodyComponents.push(clone);
      });
    };

    const selectedBodyComp = useMemo(
      () =>
        selection?.type !== "bodycomp"
          ? null
          : reportState.bodyComponents.find((c) => c._id === selection.id) ||
          null,
      [selection, reportState]
    );
    const selectedBodyRow = useMemo(
      () =>
        selection?.type !== "bodyrow"
          ? null
          : (reportState.bodyRows || []).find((r) => r._id === selection.id) ||
          null,
      [selection, reportState]
    );

    const isLandscape = reportState.page.orientation === "landscape";
    const pageWidthPt = isLandscape ? 842 : 595;
    const pageHeightPt = isLandscape ? 595 : 842;

    const leftPanelTabs: {
      id: LeftTab;
      label: string;
      color: string;
      icon: React.ReactNode;
    }[] = [
        {
          id: "page",
          label: "Page",
          color: "#64748b",
          icon: <Settings2 size={12} />,
        },
        {
          id: "header",
          label: "Header",
          color: "#2563eb",
          icon: <PanelTop size={12} />,
        },
        {
          id: "body",
          label: "Body",
          color: "#059669",
          icon: <LayoutGrid size={12} />,
        },
        {
          id: "footer",
          label: "Footer",
          color: "#7c3aed",
          icon: <PanelBottom size={12} />,
        },
      ];

    const renderTabContent = (tabId: LeftTab) => {
      if (tabId === "header" || tabId === "footer") {
        const zone = reportState.page[tabId];
        const zoneRows = (zone as any).rows || [];
        const zoneElements = zone.elements || [];
        const color = tabId === "header" ? "#2563eb" : "#7c3aed";
        const bgLight = tabId === "header" ? "#eff6ff" : "#f5f3ff";
        const borderLight = tabId === "header" ? "#bfdbfe" : "#ede9fe";
        const addRowOpen =
          tabId === "header" ? headerAddRowOpen : footerAddRowOpen;
        const setAddRowOpen =
          tabId === "header" ? setHeaderAddRowOpen : setFooterAddRowOpen;
        const addRowCols =
          tabId === "header" ? headerAddRowCols : footerAddRowCols;
        const setAddRowCols =
          tabId === "header" ? setHeaderAddRowCols : setFooterAddRowCols;
        const selectedRowId =
          tabId === "header" ? headerSelectedRowId : footerSelectedRowId;
        const selectedCol =
          tabId === "header" ? headerSelectedCol : footerSelectedCol;
        const setSelectedRowId =
          tabId === "header" ? setHeaderSelectedRowId : setFooterSelectedRowId;
        const setSelectedCol =
          tabId === "header" ? setHeaderSelectedCol : setFooterSelectedCol;
        const directElements = zoneElements.filter(
          (el: ZoneElement) => !el.rowId
        );

        return (
          <div>
            <ElementListPanel
              zone={tabId}
              elements={directElements}
              selId={
                selection?.type === "element" &&
                  (selection as any).zone === tabId
                  ? selection.id
                  : null
              }
              onSel={(id) => setSelection({ type: "element", zone: tabId, id })}
              onAdd={(type) => {
                const newEl: ZoneElement = {
                  _id: generateId(),
                  type,
                  config:
                    PALETTE.find((p) => p.type === type)?.defaultConfig || {},
                };
                if (tabId === "header")
                  mutateState((s) => {
                    s.page.header.elements.push(newEl);
                  });
                else
                  mutateState((s) => {
                    s.page.footer.elements.push(newEl);
                  });
                setSelection({ type: "element", zone: tabId, id: newEl._id });
              }}
              onReorder={(els) => {
                const rowEls = zoneElements.filter(
                  (el: ZoneElement) => el.rowId
                );
                if (tabId === "header")
                  mutateState((s) => {
                    s.page.header.elements = [...els, ...rowEls];
                  });
                else
                  mutateState((s) => {
                    s.page.footer.elements = [...els, ...rowEls];
                  });
              }}
              onDelete={(id) => deleteZoneElement(tabId, id)}
              onToggleHidden={(id) => toggleElementHidden(tabId, id)}
              onToggleLocked={(id) => toggleElementLocked(tabId, id)}
              onDuplicate={(id) => duplicateZoneElement(tabId, id)}
              onAddRow={() => setAddRowOpen(true)}
            />
            {addRowOpen && (
              <div
                style={{
                  background: T.bg2,
                  border: `2px solid ${color}`,
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color,
                    marginBottom: 6,
                  }}
                >
                  New Row — columns (slots):
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {([1, 2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setAddRowCols(n)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 11,
                        border: `2px solid ${addRowCols === n ? color : T.border
                          }`,
                        background: addRowCols === n ? color + "14" : T.bg,
                        color: addRowCols === n ? color : T.muted,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    marginBottom: 8,
                    height: 24,
                  }}
                >
                  {Array.from({ length: addRowCols }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: color + "22",
                        border: `1px solid ${color}44`,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 7.5,
                        color,
                        fontWeight: 700,
                      }}
                    >
                      Col {i + 1}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button
                    onClick={() => {
                      const newRow: ZoneRow = {
                        _id: generateId(),
                        cols: addRowCols,
                        height: 20,
                      };
                      if (tabId === "header")
                        mutateState((s) => {
                          s.page.header.rows = [
                            ...(s.page.header.rows || []),
                            newRow,
                          ];
                        });
                      else
                        mutateState((s) => {
                          s.page.footer.rows = [
                            ...(s.page.footer.rows || []),
                            newRow,
                          ];
                        });
                      setAddRowOpen(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      background: color,
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Create Row ↵
                  </button>
                  <button
                    onClick={() => setAddRowOpen(false)}
                    style={{
                      padding: "6px 10px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 5,
                      cursor: "pointer",
                      fontSize: 10,
                      color: T.muted,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {zoneRows.map((row: ZoneRow, idx: number) => {
              const rowEls = zoneElements.filter(
                (el: ZoneElement) => el.rowId === row._id
              );
              const isRowSel = selectedRowId === row._id;
              return (
                <div
                  key={row._id}
                  style={{
                    border: `2px solid ${isRowSel ? color : T.border}`,
                    borderRadius: 6,
                    marginBottom: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedRowId(row._id);
                      setSelectedCol(1);
                      setSelection({
                        type: "zonerow",
                        zone: tabId,
                        rowId: row._id,
                      } as any);
                    }}
                    style={{
                      padding: "6px 10px",
                      background: bgLight,
                      borderBottom: `1px solid ${borderLight}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <LayoutGrid size={11} style={{ color }} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.text,
                      }}
                    >
                      Row {idx + 1}
                    </span>
                    <span style={{ fontSize: 8, color: T.muted }}>
                      {row.cols} col{row.cols > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tabId === "header")
                          mutateState((s) => {
                            s.page.header.rows = (
                              s.page.header.rows || []
                            ).filter((r) => r._id !== row._id);
                            s.page.header.elements =
                              s.page.header.elements.filter(
                                (el: ZoneElement) => el.rowId !== row._id
                              );
                          });
                        else
                          mutateState((s) => {
                            s.page.footer.rows = (
                              s.page.footer.rows || []
                            ).filter((r) => r._id !== row._id);
                            s.page.footer.elements =
                              s.page.footer.elements.filter(
                                (el: ZoneElement) => el.rowId !== row._id
                              );
                          });
                        if (selectedRowId === row._id) {
                          setSelectedRowId(null);
                          setSelection(null);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: 2,
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 4,
                      padding: "6px 8px",
                      background: T.bg2,
                    }}
                  >
                    {Array.from({ length: row.cols }).map((_, ci) => {
                      const colNum = ci + 1;
                      const isSel = isRowSel && selectedCol === colNum;
                      const colW = 280 / row.cols;
                      const colEls = rowEls.filter((el: ZoneElement) => {
                        const x = el.config?.x || 0;
                        return x >= ci * colW && x < (ci + 1) * colW;
                      });
                      return (
                        <div
                          key={ci}
                          style={{
                            flex: 1,
                            border: `2px solid ${isSel ? color : T.border}`,
                            borderRadius: 5,
                            overflow: "hidden",
                            minWidth: 0,
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedRowId(row._id);
                              setSelectedCol(colNum);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 4px",
                              background: isSel ? color + "14" : T.bg,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                              border: "none",
                              borderBottom: isSel
                                ? `1px solid ${color}33`
                                : "none",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isSel ? color : T.text,
                              }}
                            >
                              Col {colNum}
                            </span>
                            <span style={{ fontSize: 7.5, color: T.muted }}>
                              {colEls.length} el
                            </span>
                            <ChevronDown
                              size={10}
                              style={{
                                color: T.muted,
                                transform: isSel ? "rotate(180deg)" : "none",
                                transition: "transform 0.15s",
                              }}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {isRowSel &&
                    (() => {
                      const ci = selectedCol - 1;
                      const colW = 280 / row.cols;
                      const colEls = rowEls.filter((el: ZoneElement) => {
                        const x = el.config?.x || 0;
                        return x >= ci * colW && x < (ci + 1) * colW;
                      });
                      return (
                        <div
                          style={{
                            borderTop: `2px solid ${color}33`,
                            background: bgLight,
                          }}
                        >
                          {colEls.length > 0 && (
                            <div style={{ padding: "4px 8px 0" }}>
                              {colEls.map((el: ZoneElement) => {
                                const pe = PALETTE.find(
                                  (p) => p.type === el.type
                                );
                                return (
                                  <div
                                    key={el._id}
                                    onClick={() =>
                                      setSelection({
                                        type: "element",
                                        zone: tabId,
                                        id: el._id,
                                      })
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "3px 6px",
                                      marginBottom: 2,
                                      background: T.bg,
                                      border: `1px solid ${T.border}`,
                                      borderRadius: 3,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <span
                                      style={{
                                        flex: 1,
                                        fontSize: 8.5,
                                        fontWeight: 600,
                                        color: T.text,
                                      }}
                                    >
                                      {(pe as any)?.label || el.type}
                                    </span>
                                    <button
                                      onClick={(e2) => {
                                        e2.stopPropagation();
                                        deleteZoneElement(tabId, el._id);
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#ef4444",
                                        padding: 1,
                                      }}
                                    >
                                      <Trash2 size={9} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ padding: "6px 8px" }}>
                            <div
                              style={{
                                fontSize: 7.5,
                                fontWeight: 700,
                                color,
                                marginBottom: 5,
                              }}
                            >
                              ADD TO COL {selectedCol}:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 3,
                              }}
                            >
                              {PALETTE.filter((p) => (p as any).zone).map(
                                (p) => (
                                  <button
                                    key={p.type}
                                    onClick={() => {
                                      const newEl: ZoneElement = {
                                        _id: generateId(),
                                        type: p.type,
                                        config: {
                                          ...(p as any).defaultConfig,
                                          x: ci * colW + 5,
                                          y: 5,
                                        },
                                        rowId: row._id,
                                      };
                                      if (tabId === "header")
                                        mutateState((s) => {
                                          s.page.header.elements.push(newEl);
                                        });
                                      else
                                        mutateState((s) => {
                                          s.page.footer.elements.push(newEl);
                                        });
                                      setSelection({
                                        type: "element",
                                        zone: tabId,
                                        id: newEl._id,
                                      });
                                    }}
                                    style={{
                                      background: (p as any).color + "15",
                                      border: `1px solid ${(p as any).color}44`,
                                      color: (p as any).color,
                                      padding: "4px 7px",
                                      borderRadius: 4,
                                      cursor: "pointer",
                                      fontSize: 9,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              );
            })}
            <button
              onClick={() => setSelection({ type: "zone", zone: tabId })}
              style={{
                width: "100%",
                background: bgLight,
                border: `1px solid ${borderLight}`,
                color,
                padding: "6px 0",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 9,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                marginTop: 8,
              }}
            >
              <Palette size={11} />
              Edit {tabId} band style
            </button>
          </div>
        );
      }

      if (tabId === "body") {
        return (
          <BodyComponentListPanel
            rows={reportState.bodyRows || []}
            comps={reportState.bodyComponents || []}
            selId={selection?.type === "bodycomp" ? selection.id : null}
            selRowId={selection?.type === "bodyrow" ? selection.id : null}
            onSelRow={(id) => setSelection({ type: "bodyrow", id })}
            onSelComp={(id) => setSelection({ type: "bodycomp", id })}
            onAddRow={addBodyRow}
            onAddComp={addBodyComp}
            onMoveComp={moveBodyComp}
            onDeleteRow={deleteBodyRow}
            onDeleteComp={deleteBodyComp}
            onUpdateRow={updateBodyRow}
            onUpdateComp={updateBodyComp}
            onToggleHidden={toggleBodyHidden}
            onToggleLocked={toggleBodyLocked}
            onToggleRowHidden={toggleBodyRowHidden}
            onToggleRowLocked={toggleBodyRowLocked}
            onDuplicate={duplicateBodyComp}
            onReorderRows={reorderBodyRows}
          />
        );
      }

      if (tabId === "page") {
        return (
          <>
            <div
              style={{
                background: T.bg2,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.text,
                  marginBottom: 4,
                }}
              >
                {reportState.page.size} · {reportState.page.orientation}
              </div>
              <div style={{ fontSize: 10, color: T.muted }}>
                Margin T{reportState.page.margin.top} B
                {reportState.page.margin.bottom} L{reportState.page.margin.left}{" "}
                R{reportState.page.margin.right}
              </div>
            </div>
            <ThemesPicker onApply={applyTheme} />
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 0 6px",
                  borderBottom: `1.5px solid ${T.border}`,
                  marginBottom: 6,
                }}
              >
                <Hash size={9} color="#d97706" />
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: T.text,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    flex: 1,
                  }}
                >
                  Report Variables
                </span>
                <button
                  onClick={() =>
                    mutateState((s) => {
                      if (!s.reportVariables) s.reportVariables = [];
                      s.reportVariables.push({
                        _id: generateId(),
                        name: "New_Variable",
                        dataSourceRef: "",
                        columnKey: "",
                        staticValue: "",
                      });
                    })
                  }
                  style={{
                    background: "#d97706" + "18",
                    border: "1px solid #d97706" + "44",
                    color: "#d97706",
                    fontSize: 8.5,
                    padding: "2px 7px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Plus size={9} />
                  Variable
                </button>
              </div>
              {(!reportState.reportVariables ||
                reportState.reportVariables.length === 0) && (
                  <div
                    style={{
                      fontSize: 9,
                      color: T.muted,
                      textAlign: "center",
                      padding: "6px 0",
                    }}
                  >
                    No variables yet — click <strong>+ Variable</strong> to add
                    one
                  </div>
                )}
              {(reportState.reportVariables || []).map((v, idx) => {
                const fld: React.CSSProperties = {
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: 10,
                  padding: "4px 7px",
                  border: `1px solid ${T.border}`,
                  borderRadius: 5,
                  outline: "none",
                  background: T.bg,
                  color: T.text,
                };
                return (
                  <div
                    key={v._id}
                    style={{
                      background: T.bg2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: "9px 10px",
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#d97706",
                        }}
                      >
                        Var {idx + 1}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(`{[${v.name}]}`)
                              .catch(() => { })
                          }
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            color: "#d97706",
                            cursor: "pointer",
                            padding: "2px 5px",
                            borderRadius: 4,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          <Copy size={8} />
                        </button>
                        <button
                          onClick={() =>
                            mutateState((s) => {
                              s.reportVariables = (
                                s.reportVariables || []
                              ).filter((rv) => rv._id !== v._id);
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            padding: 2,
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 5 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          marginBottom: 2,
                        }}
                      >
                        Name
                      </div>
                      <input
                        value={v.name}
                        onChange={(e) =>
                          mutateState((s) => {
                            const rv = (s.reportVariables || []).find(
                              (r) => r._id === v._id
                            );
                            if (rv)
                              rv.name = e.target.value.replace(
                                /[\[\]\{\}\s]/g,
                                "_"
                              );
                          })
                        }
                        placeholder="Invoice_No"
                        style={{ ...fld, fontFamily: "monospace" }}
                      />
                    </div>
                    <div style={{ marginBottom: 5 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          marginBottom: 2,
                        }}
                      >
                        Column Key
                      </div>
                      <input
                        value={v.columnKey}
                        onChange={(e) =>
                          mutateState((s) => {
                            const rv = (s.reportVariables || []).find(
                              (r) => r._id === v._id
                            );
                            if (rv) rv.columnKey = e.target.value;
                          })
                        }
                        placeholder="column_key"
                        style={{ ...fld, fontFamily: "monospace" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          marginBottom: 2,
                        }}
                      >
                        Static Fallback
                      </div>
                      <input
                        value={v.staticValue || ""}
                        onChange={(e) =>
                          mutateState((s) => {
                            const rv = (s.reportVariables || []).find(
                              (r) => r._id === v._id
                            );
                            if (rv) rv.staticValue = e.target.value;
                          })
                        }
                        placeholder="e.g. INV-0001"
                        style={fld}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      return null;
    };
    const getRightPanelAccent = () => {
      if (selection?.type === "multi") return "#7c3aed";
      if (selection?.type === "bodyrow") return "#059669";
      if (selection?.type === "element")
        return PALETTE.find((p) => p.type === selectedElement?.type)
          ? (PALETTE.find((p) => p.type === selectedElement?.type) as any).color
          : "#2563eb";
      if (selection?.type === "zone")
        return (selection as any).zone === "header" ? "#2563eb" : "#7c3aed";
      if (selection?.type === "bodycomp" && selectedBodyComp)
        return BODY_COMP_META[selectedBodyComp.type]?.color || "#059669";
      if (activeTab === "body") return "#059669";
      return "#64748b";
    };

    useImperativeHandle(
      ref,
      () => ({
        getConfigData: () => undoState.present,
      }),
      [undoState]
    );

    return (
      <div
        style={{
          height: height ?? "100%",
          minHeight: height ? undefined : 600,
          width: width ?? "100%",
          display: "flex",
          flexDirection: "column",
          background: T.bg3,
          fontFamily: "'Segoe UI',system-ui,sans-serif",
          overflow: "hidden",
          color: T.text,
        }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs"
          style={{
            background: T.bg,
            borderColor: T.border,
            color: T.text,
          }}
        >
          {/* Left Title & Command Code Block (Mirrors FormHeader) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LayoutTemplate className="size-3.5" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground whitespace-nowrap leading-tight">
                Report Studio
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                SC.REPORT.DESIGN
              </span>
            </div>
          </div>

          {/* Right Section: Compact & Categorized Action Toolbar matching FormHeader size & feel */}
          <TooltipProvider delay={150}>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Group 1: History (Undo / Redo) */}
              <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-md border border-border/60">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={undo}
                        disabled={histLen === 0}
                        className="size-7 text-foreground hover:bg-background shrink-0 disabled:opacity-40"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">
                    {histLen === 0
                      ? "Undo (Ctrl+Z)"
                      : `Undo (Ctrl+Z) — ${histLen} step${histLen !== 1 ? "s" : ""} back`}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={redo}
                        disabled={futLen === 0}
                        className="size-7 text-foreground hover:bg-background shrink-0 disabled:opacity-40"
                      >
                        <RotateCw className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">
                    {futLen === 0
                      ? "Redo (Ctrl+Y)"
                      : `Redo (Ctrl+Y) — ${futLen} step${futLen !== 1 ? "s" : ""} forward`}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Group 2: Design & Templates */}
              <div className="flex items-center gap-1">
                {/* Templates Modal Trigger */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplates(true)}
                        className="h-8 px-2.5 text-xs gap-1.5 font-medium border-border/70 hover:bg-muted/60 text-foreground shrink-0"
                      >
                        <LayoutTemplate className="size-3.5 text-primary" />
                        <span>Templates</span>
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">Browse & apply preset templates</TooltipContent>
                </Tooltip>

                {/* Themes Dropdown */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowThemes((v) => !v)}
                          className={cn(
                            "h-8 px-2.5 text-xs gap-1.5 font-medium border-border/70 text-foreground shrink-0 transition-colors",
                            showThemes && "bg-primary/10 text-primary border-primary/40"
                          )}
                        >
                          <Palette className="size-3.5 text-purple-500" />
                          <span>Themes</span>
                          <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                        </Button>
                      }
                    />
                    <TooltipContent className="text-xs">Select color palette & style theme</TooltipContent>
                  </Tooltip>
                  {showThemes && (
                    <div
                      style={{
                        position: "absolute",
                        top: 38,
                        right: 0,
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,.25)",
                        padding: "12px",
                        zIndex: 30,
                        minWidth: 220,
                      }}
                    >
                      <ThemesPicker onApply={applyTheme} />
                    </div>
                  )}
                </div>

                {/* Reset Dropdown Confirmation */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setShowResetConfirm((v) => !v)}
                          className={cn(
                            "size-8 border-border/70 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 shrink-0 transition-colors cursor-pointer",
                            showResetConfirm && "border-destructive/40 bg-destructive/10 text-destructive"
                          )}
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                      }
                    />
                    <TooltipContent className="text-xs">Reset design to default</TooltipContent>
                  </Tooltip>
                  {showResetConfirm && (
                    <div
                      style={{
                        position: "absolute",
                        top: 38,
                        right: 0,
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                        padding: "14px 16px",
                        zIndex: 30,
                        minWidth: 200,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: T.text,
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        Reset to default design?
                      </div>
                      <div
                        style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}
                      >
                        This cannot be undone.
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={resetToDefault}
                          style={{
                            flex: 1,
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            padding: "5px 0",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Yes, reset
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          style={{
                            flex: 1,
                            background: T.bg2,
                            color: T.muted,
                            border: "none",
                            padding: "5px 0",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Group 3: View & Canvas Controls (Compact Zoom & Grid Snap) */}
              <div className="flex items-center gap-1">
                {/* Zoom Stepper Control */}
                <div className="flex items-center h-8 rounded-md border border-border/70 bg-muted/20 px-1 gap-0.5">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            setCanvasZoom((z) => Math.max(0.5, +(z - 0.05).toFixed(2)))
                          }
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          <ZoomOut className="size-3" />
                        </Button>
                      }
                    />
                    <TooltipContent className="text-xs">Zoom Out</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="font-mono text-xs font-semibold px-1 py-0.5 rounded text-foreground hover:bg-muted/60 flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{Math.round(canvasZoom * 100)}%</span>
                          <ChevronDown className="size-2.5 text-muted-foreground" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="center" className="min-w-28 text-xs">
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-mono">
                        Zoom Level
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[50, 75, 100, 125, 150, 200].map((z) => (
                        <DropdownMenuItem
                          key={z}
                          onClick={() => setCanvasZoom(z / 100)}
                          className={cn(
                            "cursor-pointer text-xs justify-between",
                            Math.round(canvasZoom * 100) === z && "font-bold text-primary"
                          )}
                        >
                          <span>{z}%</span>
                          {Math.round(canvasZoom * 100) === z && <span>✓</span>}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={fitToScreen} className="cursor-pointer text-xs gap-1.5">
                        <Maximize2 className="size-3" />
                        <span>Fit to Screen</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            setCanvasZoom((z) => Math.min(2.5, +(z + 0.05).toFixed(2)))
                          }
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          <ZoomIn className="size-3" />
                        </Button>
                      }
                    />
                    <TooltipContent className="text-xs">Zoom In</TooltipContent>
                  </Tooltip>
                </div>

                {/* Snap Grid Toggle */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant={snapGrid ? "secondary" : "outline"}
                        size="icon-sm"
                        onClick={() => setSnapGrid((v) => !v)}
                        className={cn(
                          "size-8 border-border/70 text-muted-foreground hover:text-foreground shrink-0 transition-colors",
                          snapGrid && "bg-blue-500/15 text-blue-500 border-blue-500/40 hover:bg-blue-500/20"
                        )}
                      >
                        <Crosshair className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">
                    Snap to Grid: {snapGrid ? "ON" : "OFF"}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Group 4: Data & Schema (Unified Import / Export Menu) */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1.5 font-medium border-border/70 hover:bg-muted/60 text-foreground shrink-0"
                          >
                            <Database className="size-3.5 text-emerald-500" />
                            <span>Data</span>
                            <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent className="text-xs">Import or export report definition JSON</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground font-mono uppercase">
                    Data & Configuration
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowImportModal(true)}
                    className="cursor-pointer gap-2 py-1.5"
                  >
                    <FolderOpen className="size-3.5 text-emerald-500" />
                    <span>Import JSON...</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsJsonModalOpen(true)}
                    className="cursor-pointer gap-2 py-1.5"
                  >
                    <FileJson className="size-3.5 text-blue-500" />
                    <span>Export JSON...</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Group 5: Primary Action CTAs (Save & Print PDF) */}
              <div className="flex items-center gap-1.5">
                {/* Save CTA */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const d = buildReportJson(reportState);
                          console.log("Report Studio — Save:", d);
                        }}
                        className="h-8 px-3 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs cursor-pointer"
                      >
                        <Save className="size-3.5" />
                        <span>Save</span>
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">Save report design layout</TooltipContent>
                </Tooltip>

                {/* Print PDF CTA */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handlePrintPDF}
                        disabled={isLoadingData}
                        className="h-8 px-3 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <FileImage className="size-3.5" />
                        <span>{isLoadingData ? "Loading..." : "Print"}</span>
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">Generate & print report PDF preview</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* LEFT PANEL */}
          <div
            ref={leftPanelRef}
            style={{
              position: "relative",
              width: leftPanelCollapsed ? 52 : 260,
              minWidth: leftPanelCollapsed ? 52 : 260,
              background: T.bg,
              borderRight: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              transition: "width .18s ease, min-width .18s ease",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: leftPanelCollapsed ? "column" : "row",
                borderBottom: leftPanelCollapsed ? "none" : `1px solid ${T.border}`,
                background: T.bg2,
                width: "100%",
              }}
            >
              {leftPanelTabs.map((t) => (
                <button
                  key={t.id}
                  data-left-tab={t.id}
                  onClick={() => {
                    if (leftPanelCollapsed) setLeftPanelCollapsed(false);
                    setActiveTab(t.id);
                    setHeaderSelectedRowId(null);
                    setFooterSelectedRowId(null);
                    if (t.id === "page") setSelection(null);
                    else if (t.id === "header")
                      setSelection({ type: "zone", zone: "header" });
                    else if (t.id === "footer")
                      setSelection({ type: "zone", zone: "footer" });
                    else if (t.id === "body") setSelection(null);
                    setHoveredTab(null);
                  }}
                  onMouseEnter={() => {
                    if (leftPanelCollapsed) setHoveredTab(t.id);
                  }}
                  onMouseLeave={() => {
                    if (leftPanelCollapsed)
                      setHoveredTab((prev) => (prev === t.id ? null : prev));
                  }}
                  title={t.label}
                  style={{
                    flex: leftPanelCollapsed ? "0 0 auto" : "1 1 0",
                    minWidth: 0,
                    width: leftPanelCollapsed ? "100%" : undefined,
                    height: leftPanelCollapsed ? 44 : undefined,
                    background: activeTab === t.id ? T.bg : "transparent",
                    border: "none",
                    borderBottom: leftPanelCollapsed
                      ? "none"
                      : activeTab === t.id
                        ? `3px solid ${t.color}`
                        : "3px solid transparent",
                    borderLeft:
                      leftPanelCollapsed && activeTab === t.id
                        ? `3px solid ${t.color}`
                        : "3px solid transparent",
                    borderTop: "none",
                    color: activeTab === t.id ? t.color : T.muted,
                    paddingTop: leftPanelCollapsed ? 0 : 8,
                    paddingBottom: leftPanelCollapsed ? 0 : 6,
                    paddingLeft: 2,
                    paddingRight: 2,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    lineHeight: 1.2,
                    transition: "color .15s,background .15s",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ display: "flex", flexShrink: 0 }}>
                    {t.icon}
                  </span>
                  {!leftPanelCollapsed && (
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      {t.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {!leftPanelCollapsed && (
              <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {renderTabContent(activeTab)}
              </div>
            )}
            <button
              onClick={() => setLeftPanelCollapsed((v) => !v)}
              title={leftPanelCollapsed ? "Expand panel" : "Collapse panel"}
              style={{
                position: "absolute",
                top: 9,
                right: -26,
                width: 26,
                height: 26,
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderLeft: "none",
                color: T.text,
                cursor: "pointer",
                borderRadius: "0 13px 13px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxShadow: "2px 2px 6px rgba(0,0,0,.2)",
                zIndex: 15,
              }}
            >
              <ChevronRight
                size={14}
                style={{
                  transform: leftPanelCollapsed ? undefined : "rotate(180deg)",
                  transition: "transform .18s",
                }}
              />
            </button>
            {leftPanelCollapsed &&
              hoveredTab &&
              (() => {
                const btnEl = leftPanelRef.current?.querySelector(
                  `[data-left-tab="${hoveredTab}"]`
                ) as HTMLElement | null;
                const panelEl = leftPanelRef.current;
                let topOffset = 12;
                if (btnEl && panelEl) {
                  const btnRect = btnEl.getBoundingClientRect();
                  const panelRect = panelEl.getBoundingClientRect();
                  topOffset = Math.max(0, btnRect.top - panelRect.top);
                }
                const tab = leftPanelTabs.find((t) => t.id === hoveredTab)!;
                return (
                  <div
                    key={hoveredTab}
                    onMouseEnter={() => setHoveredTab(hoveredTab)}
                    onMouseLeave={() => setHoveredTab(null)}
                    style={{
                      position: "absolute",
                      top: topOffset,
                      left: "100%",
                      width: 280,
                      maxHeight: "calc(100% - 24px)",
                      background: T.bg,
                      borderRadius: "0 10px 10px 10px",
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.2)",
                      border: `1px solid ${tab.color}33`,
                      borderLeft: `3px solid ${tab.color}`,
                      zIndex: 20,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: `${tab.color}15`,
                        borderBottom: `1px solid ${tab.color}33`,
                        color: tab.color,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ display: "flex" }}>{tab.icon}</span>
                      <span style={{ flex: 1 }}>{tab.label}</span>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          setLeftPanelCollapsed(false);
                          setHoveredTab(null);
                        }}
                        style={{
                          background: T.bg,
                          border: `1px solid ${tab.color}44`,
                          color: tab.color,
                          cursor: "pointer",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Pin size={9} />
                        Pin
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                      {renderTabContent(hoveredTab)}
                    </div>
                  </div>
                );
              })()}
          </div>

          <style>{`@keyframes popoverFadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }`}</style>

          {/* CANVAS */}
          <div
            ref={canvasContainerRef}
            style={{
              flex: 1,
              overflow: "auto",
              background: T.bg3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 28px 20px",
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            {/* <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, opacity: .7 }}>
            Click to select · Right-click for options · Del to delete · F to fit screen · Drag handles to resize
          </div> */}
            <div
              style={{ position: "relative", flexShrink: 0 }}
              onClick={() => {
                setSelection(null);
                setHeaderSelectedRowId(null);
                setFooterSelectedRowId(null);
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -18,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 9, color: "#94a3b8" }}>
                  {reportState.page.size} · {reportState.page.orientation} ·{" "}
                  {Math.round(canvasZoom * 100)}%
                </span>
              </div>
              <div
                data-page-root
                style={{
                  width: pageWidthPt * canvasZoom,
                  height: pageHeightPt * canvasZoom,
                  background: "#fff",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow:
                    "0 4px 6px rgba(0,0,0,.07),0 20px 60px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.06)",
                  borderRadius: 2,
                }}
              >
                {(() => {
                  const ml = Math.round(
                    (reportState.page.margin.left || 0) * canvasZoom
                  );
                  const mr = Math.round(
                    (reportState.page.margin.right || 0) * canvasZoom
                  );
                  const mt = Math.round(
                    (reportState.page.margin.top || 0) * canvasZoom
                  );
                  const mb = Math.round(
                    (reportState.page.margin.bottom || 0) * canvasZoom
                  );
                  return (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          zIndex: 50,
                          boxShadow: `inset ${ml}px ${mt}px 0 rgba(37,99,235,.06), inset -${mr}px -${mb}px 0 rgba(37,99,235,.06)`,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: mt,
                          left: ml,
                          right: mr,
                          bottom: mb,
                          border: "1px dashed rgba(37,99,235,.15)",
                          pointerEvents: "none",
                          zIndex: 51,
                        }}
                      />
                    </>
                  );
                })()}
                <div
                  ref={headerBandRef}
                  style={{
                    position: "absolute",
                    top: Math.round(
                      (reportState.page.margin.top || 0) * canvasZoom
                    ),
                    left: Math.round(
                      (reportState.page.margin.left || 0) * canvasZoom
                    ),
                    right: Math.round(
                      (reportState.page.margin.right || 0) * canvasZoom
                    ),
                  }}
                >
                  <BandCanvas
                    zone="header"
                    data={reportState.page.header}
                    scale={canvasZoom}
                    selId={
                      selection?.type === "element" &&
                        (selection as any).zone === "header"
                        ? selection.id
                        : null
                    }
                    selRowId={
                      (selection as any)?.type === "zonerow" &&
                        (selection as any)?.zone === "header"
                        ? (selection as any).rowId
                        : headerSelectedRowId
                    }
                    isZoneSel={
                      selection?.type === "zone" &&
                      (selection as any).zone === "header"
                    }
                    multiSelIds={
                      selection?.type === "multi" &&
                        (selection as any).zone === "header"
                        ? (selection as any).ids
                        : undefined
                    }
                    onSelEl={(id) => {
                      setSelection({ type: "element", zone: "header", id });
                      setActiveTab("header");
                      setHeaderSelectedRowId(null);
                    }}
                    onSelRow={(id) => {
                      setSelection({
                        type: "zonerow",
                        zone: "header",
                        rowId: id,
                      } as any);
                      setActiveTab("header");
                      setHeaderSelectedRowId(id);
                    }}
                    onMultiSel={(ids) => {
                      setSelection({ type: "multi", zone: "header", ids });
                      setActiveTab("header");
                      setHeaderSelectedRowId(null);
                    }}
                    onSelZone={() => {
                      setSelection({ type: "zone", zone: "header" });
                      setActiveTab("header");
                      setHeaderSelectedRowId(null);
                    }}
                    onUpdateEl={(upd) => updateZoneElement("header", upd)}
                    onUpdateElSilent={(upd) =>
                      updateZoneElementSilent("header", upd)
                    }
                    onCommitElDrag={(upd) =>
                      commitZoneElementDrag("header", upd)
                    }
                    onCommitMulti={(els) =>
                      mutateState((s) => {
                        els.forEach((u: ZoneElement) => {
                          const i = s.page.header.elements.findIndex(
                            (e: ZoneElement) => e._id === u._id
                          );
                          if (i >= 0) s.page.header.elements[i] = u;
                        });
                      })
                    }
                    onDeleteEl={(id) => deleteZoneElement("header", id)}
                    onReorder={(els) => reorderZoneElements("header", els)}
                    onCtxMenu={(m) => setCtxMenu(m)}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top:
                      Math.round(
                        (reportState.page.margin.top || 0) * canvasZoom
                      ) + headerBandHeight,
                    left: Math.round(
                      (reportState.page.margin.left || 0) * canvasZoom
                    ),
                    right: Math.round(
                      (reportState.page.margin.right || 0) * canvasZoom
                    ),
                    bottom:
                      Math.round(
                        (reportState.page.margin.bottom || 0) * canvasZoom
                      ) + footerBandHeight,
                    overflow: "visible",
                  }}
                >
                  <BodyCanvas
                    reportState={reportState}
                    scale={canvasZoom}
                    selId={selection?.type === "bodycomp" ? selection.id : null}
                    selRowId={
                      selection?.type === "bodyrow" ? selection.id : null
                    }
                    selColId={null}
                    snapGrid={snapGrid}
                    onSelComp={(id) => {
                      setSelection({ type: "bodycomp", id });
                      setActiveTab("body");
                    }}
                    onSelRow={(id) => {
                      setSelection({ type: "bodyrow", id });
                      setActiveTab("body");
                    }}
                    onSelCol={() => { }}
                    onReorder={reorderBodyComps}
                    onReorderCols={() => { }}
                    onUpdateComp={updateBodyComp}
                    onUpdateRow={updateBodyRow}
                    onAddComp={addBodyComp}
                    onAddRow={addBodyRow}
                    onBodyCtxMenu={(m) => setBodyCtxMenu(m)}
                  />
                </div>
                <div
                  ref={footerBandRef}
                  style={{
                    position: "absolute",
                    bottom: Math.round(
                      (reportState.page.margin.bottom || 0) * canvasZoom
                    ),
                    left: Math.round(
                      (reportState.page.margin.left || 0) * canvasZoom
                    ),
                    right: Math.round(
                      (reportState.page.margin.right || 0) * canvasZoom
                    ),
                  }}
                >
                  <BandCanvas
                    zone="footer"
                    data={reportState.page.footer}
                    scale={canvasZoom}
                    selId={
                      selection?.type === "element" &&
                        (selection as any).zone === "footer"
                        ? selection.id
                        : null
                    }
                    selRowId={
                      (selection as any)?.type === "zonerow" &&
                        (selection as any)?.zone === "footer"
                        ? (selection as any).rowId
                        : footerSelectedRowId
                    }
                    isZoneSel={
                      selection?.type === "zone" &&
                      (selection as any).zone === "footer"
                    }
                    multiSelIds={
                      selection?.type === "multi" &&
                        (selection as any).zone === "footer"
                        ? (selection as any).ids
                        : undefined
                    }
                    onSelEl={(id) => {
                      setSelection({ type: "element", zone: "footer", id });
                      setActiveTab("footer");
                      setFooterSelectedRowId(null);
                    }}
                    onSelRow={(id) => {
                      setSelection({
                        type: "zonerow",
                        zone: "footer",
                        rowId: id,
                      } as any);
                      setActiveTab("footer");
                      setFooterSelectedRowId(id);
                    }}
                    onMultiSel={(ids) => {
                      setSelection({ type: "multi", zone: "footer", ids });
                      setActiveTab("footer");
                      setFooterSelectedRowId(null);
                    }}
                    onSelZone={() => {
                      setSelection({ type: "zone", zone: "footer" });
                      setActiveTab("footer");
                      setFooterSelectedRowId(null);
                    }}
                    onUpdateEl={(upd) => updateZoneElement("footer", upd)}
                    onUpdateElSilent={(upd) =>
                      updateZoneElementSilent("footer", upd)
                    }
                    onCommitElDrag={(upd) =>
                      commitZoneElementDrag("footer", upd)
                    }
                    onCommitMulti={(els) =>
                      mutateState((s) => {
                        els.forEach((u: ZoneElement) => {
                          const i = s.page.footer.elements.findIndex(
                            (e: ZoneElement) => e._id === u._id
                          );
                          if (i >= 0) s.page.footer.elements[i] = u;
                        });
                      })
                    }
                    onDeleteEl={(id) => deleteZoneElement("footer", id)}
                    onReorder={(els) => reorderZoneElements("footer", els)}
                    onCtxMenu={(m) => setCtxMenu(m)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              width: rightPanelCollapsed ? 36 : 280,
              background: T.bg,
              borderLeft: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              boxShadow: "-2px 0 8px rgba(0,0,0,.04)",
              transition: "width .2s ease",
              overflow: "hidden",
            }}
          >
            {(() => {
              const accent = getRightPanelAccent();
              type Crumb = {
                label: string;
                icon?: React.ReactNode;
                color?: string;
                onClick?: () => void;
              };
              const crumbs: Crumb[] = [];
              crumbs.push({
                label: "Page",
                icon: <Settings2 size={9} />,
                color: T.muted,
                onClick: selection ? () => setSelection(null) : undefined,
              });
              if (selection?.type === "zone") {
                crumbs.push({
                  label:
                    (selection as any).zone === "header" ? "Header" : "Footer",
                  color:
                    (selection as any).zone === "header"
                      ? "#2563eb"
                      : "#7c3aed",
                });
              } else if (selection?.type === "element" && selectedElement) {
                const zone = (selection as any).zone as "header" | "footer";
                crumbs.push({
                  label: zone === "header" ? "Header" : "Footer",
                  color: zone === "header" ? "#2563eb" : "#7c3aed",
                  onClick: () => setSelection({ type: "zone", zone }),
                });
                const pal = PALETTE.find(
                  (p) => p.type === selectedElement.type
                );
                const elLabel =
                  selectedElement.type === "TEXT" ||
                    selectedElement.type === "DATE_TIME"
                    ? selectedElement.config.text?.slice(0, 14) ||
                    selectedElement.type
                    : selectedElement.type;
                crumbs.push({
                  label: elLabel,
                  color: (pal as any)?.color || accent,
                });
              } else if (selection?.type === "multi") {
                const zone = (selection as any).zone as "header" | "footer";
                crumbs.push({
                  label: zone === "header" ? "Header" : "Footer",
                  color: zone === "header" ? "#2563eb" : "#7c3aed",
                  onClick: () => setSelection({ type: "zone", zone }),
                });
                crumbs.push({
                  label: `${(selection as any).ids.length} selected`,
                  color: "#7c3aed",
                });
              } else if (selection?.type === "bodyrow" && selectedBodyRow) {
                crumbs.push({
                  label: "Body",
                  color: "#059669",
                  onClick: () => setSelection(null),
                });
                crumbs.push({
                  label: selectedBodyRow.label ?? "Row",
                  color: "#059669",
                });
              } else if (selection?.type === "bodycomp" && selectedBodyComp) {
                const row = (reportState.bodyRows || []).find(
                  (r) => r._id === selectedBodyComp.rowId
                );
                crumbs.push({
                  label: "Body",
                  color: "#059669",
                  onClick: () => setSelection(null),
                });
                if (row)
                  crumbs.push({
                    label: row.label ?? "Row",
                    color: "#059669",
                    onClick: () =>
                      setSelection({ type: "bodyrow", id: row._id }),
                  });
                const meta = BODY_COMP_META[selectedBodyComp.type];
                crumbs.push({
                  label: selectedBodyComp.label || meta.label,
                  color: meta.color,
                  icon: <meta.Icon size={9} />,
                });
              } else if (activeTab === "body") {
                crumbs.push({ label: "Body", color: "#059669" });
              } else if (activeTab === "header") {
                crumbs.push({
                  label: "Header",
                  color: "#2563eb",
                  onClick: () => setSelection({ type: "zone", zone: "header" }),
                });
              } else if (activeTab === "footer") {
                crumbs.push({
                  label: "Footer",
                  color: "#7c3aed",
                  onClick: () => setSelection({ type: "zone", zone: "footer" }),
                });
              }
              const lastIdx = crumbs.length - 1;
              return (
                <div
                  style={{
                    padding: "7px 8px 7px",
                    borderBottom: `1px solid ${T.border}`,
                    flexShrink: 0,
                    background: T.bg,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <button
                      onClick={() => setRightPanelCollapsed((c) => !c)}
                      style={{
                        width: 22,
                        height: 22,
                        background: "none",
                        border: `1px solid ${T.border}`,
                        borderRadius: 5,
                        color: T.muted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {rightPanelCollapsed ? (
                        <ChevronRight
                          size={12}
                          style={{ transform: "rotate(180deg)" }}
                        />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    {!rightPanelCollapsed && (
                      <>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            overflow: "hidden",
                            minWidth: 0,
                          }}
                        >
                          {crumbs.map((crumb, i) => {
                            const isLast = i === lastIdx;
                            return (
                              <React.Fragment key={i}>
                                {i > 0 && (
                                  <span
                                    style={{
                                      color: "#cbd5e1",
                                      fontSize: 9,
                                      flexShrink: 0,
                                    }}
                                  >
                                    ›
                                  </span>
                                )}
                                <button
                                  onClick={crumb.onClick}
                                  disabled={!crumb.onClick || isLast}
                                  title={crumb.label}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    background: "none",
                                    border: "none",
                                    padding: "2px 3px",
                                    borderRadius: 4,
                                    cursor:
                                      crumb.onClick && !isLast
                                        ? "pointer"
                                        : "default",
                                    color: isLast
                                      ? crumb.color || accent
                                      : T.muted,
                                    fontSize: isLast ? 10 : 9,
                                    fontWeight: isLast ? 700 : 400,
                                    flexShrink: isLast ? 1 : 0,
                                    minWidth: 0,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {crumb.icon && (
                                    <span
                                      style={{
                                        display: "flex",
                                        color: isLast
                                          ? crumb.color || accent
                                          : T.muted,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {crumb.icon}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      minWidth: 0,
                                    }}
                                  >
                                    {crumb.label}
                                  </span>
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {selection && (
                          <button
                            onClick={() => setSelection(null)}
                            style={{
                              width: 20,
                              height: 20,
                              background: "none",
                              border: `1px solid ${T.border}`,
                              borderRadius: 4,
                              color: T.muted,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {!rightPanelCollapsed && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 5,
                        paddingTop: 5,
                        borderTop: `1px solid ${accent}18`,
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 10,
                          background: accent,
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: T.muted,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Properties Inspector
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
            {rightPanelCollapsed && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 10,
                  gap: 10,
                }}
              >
                <div
                  title="Properties"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: getRightPanelAccent() + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: getRightPanelAccent(),
                  }}
                >
                  <SlidersHorizontal size={12} />
                </div>
              </div>
            )}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 14px",
                display: rightPanelCollapsed ? "none" : "block",
              }}
            >
              {selection?.type === "multi" &&
                (() => {
                  const sel = selection as any;
                  const zone = sel.zone as "header" | "footer";
                  return (
                    <MultiSelectPanel
                      ids={sel.ids}
                      zone={zone}
                      elements={reportState.page[zone].elements}
                      pageMargin={reportState.page.margin}
                      pageOrientation={reportState.page.orientation}
                      pageSize={reportState.page.size}
                      onSetSelection={setSelection}
                      onCommit={(updated) =>
                        mutateState((s: any) => {
                          updated.forEach((u: ZoneElement) => {
                            const i = s.page[sel.zone].elements.findIndex(
                              (e: any) => e._id === u._id
                            );
                            if (i >= 0) s.page[sel.zone].elements[i] = u;
                          });
                        })
                      }
                    />
                  );
                })()}
              {selection?.type === "element" && selectedElement && (
                <ElementPropsPanel
                  el={selectedElement}
                  zone={(selection as any).zone}
                  onUpdate={(u) =>
                    updateZoneElement((selection as any).zone, u)
                  }
                  onDelete={() =>
                    deleteZoneElement((selection as any).zone, selection.id)
                  }
                  onDuplicate={() =>
                    duplicateZoneElement((selection as any).zone, selection.id)
                  }
                  onZOrder={(dir) =>
                    zOrderZoneElement(
                      (selection as any).zone,
                      selection.id,
                      dir
                    )
                  }
                  onSnapAlign={(h, v) => {
                    const sel2 = selection as any;
                    const zd =
                      reportState.page[sel2.zone as "header" | "footer"];
                    const pgW =
                      getPageWidthMm(
                        reportState.page.size || "A4",
                        reportState.page.orientation
                      ) -
                      (reportState.page.margin?.left || 0) -
                      (reportState.page.margin?.right || 0);
                    const pL = zd.padding?.left || 0,
                      pR = zd.padding?.right || 0,
                      pT = zd.padding?.top || 0,
                      pB = zd.padding?.bottom || 0;
                    const uW = pgW - pL - pR,
                      bandH = zd.height || (sel2.zone === "footer" ? 28 : 20),
                      uH = bandH - pT - pB;
                    const el2 = zd.elements.find((e: any) => e._id === sel2.id);
                    if (!el2) return;
                    const eW = el2.config.width || 80,
                      eH = el2.config.fontSize
                        ? el2.config.fontSize * 0.353
                        : 5;
                    const n = deepClone(el2);
                    if (h === "left") n.config.x = 0;
                    if (h === "center") n.config.x = Math.round((uW - eW) / 2);
                    if (h === "right") n.config.x = Math.round(uW - eW);
                    if (v === "top") n.config.y = 0;
                    if (v === "middle") n.config.y = Math.round((uH - eH) / 2);
                    if (v === "bottom") n.config.y = Math.round(uH - eH);
                    mutateState((s: any) => {
                      const i = s.page[sel2.zone].elements.findIndex(
                        (e: any) => e._id === sel2.id
                      );
                      if (i >= 0) s.page[sel2.zone].elements[i] = n;
                    });
                  }}
                />
              )}
              {(selection as any)?.type === "zonerow" &&
                (() => {
                  const sel3 = selection as any;
                  const zone3 =
                    sel3.zone === "header"
                      ? reportState.page.header
                      : reportState.page.footer;
                  const row3 = zone3.rows?.find(
                    (r: ZoneRow) => r._id === sel3.rowId
                  );
                  if (!row3) return null;
                  return (
                    <ZoneRowPropsPanel
                      row={row3}
                      zone={sel3.zone}
                      onUpdate={(updatedRow) =>
                        mutateState((s) => {
                          const z =
                            sel3.zone === "header"
                              ? s.page.header
                              : s.page.footer;
                          const idx = z.rows?.findIndex(
                            (r: ZoneRow) => r._id === row3._id
                          );
                          if (idx !== undefined && idx >= 0 && z.rows)
                            z.rows[idx] = updatedRow;
                        })
                      }
                      onDelete={() => {
                        mutateState((s) => {
                          const z =
                            sel3.zone === "header"
                              ? s.page.header
                              : s.page.footer;
                          z.rows = z.rows?.filter(
                            (r: ZoneRow) => r._id !== row3._id
                          );
                          z.elements = z.elements.filter(
                            (el: ZoneElement) => el.rowId !== row3._id
                          );
                        });
                        setSelection(null);
                      }}
                    />
                  );
                })()}
              {selection?.type === "zone" && (
                <ZoneStylePanel
                  zone={(selection as any).zone}
                  data={(reportState.page as any)[(selection as any).zone]}
                  onUpdate={(v) =>
                    mutateState((s) => {
                      (s.page as any)[(selection as any).zone] = v;
                    })
                  }
                />
              )}
              {selection?.type === "bodyrow" && selectedBodyRow && (
                <BodyRowPropsPanel
                  row={selectedBodyRow}
                  compsCount={
                    (reportState.bodyComponents || []).filter(
                      (c) => c.rowId === selectedBodyRow._id
                    ).length
                  }
                  onUpdate={updateBodyRow}
                  onDelete={() => deleteBodyRow(selectedBodyRow._id)}
                />
              )}
              {selection?.type === "bodycomp" && selectedBodyComp && (
                <BodyCompPropsPanel
                  comp={selectedBodyComp}
                  onUpdate={updateBodyComp}
                  onDelete={() => deleteBodyComp(selectedBodyComp._id)}
                  onDuplicate={() => duplicateBodyComp(selectedBodyComp._id)}
                  centralData={reportState.centralData}
                  onUpdateCentralData={(cd) =>
                    mutateState((s) => {
                      s.centralData = cd;
                    })
                  }
                  componentDataSources={reportState.componentDataSources}
                  onUpdateComponentDataSources={(cds) =>
                    mutateState((s) => {
                      s.componentDataSources = cds;
                    })
                  }
                  reportVariables={reportState.reportVariables}
                  onUpdateReportVariables={(vars) =>
                    mutateState((s) => {
                      s.reportVariables = vars;
                    })
                  }
                />
              )}
              {!selection && activeTab === "body" && (
                <div
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    textAlign: "center",
                    padding: "24px 0 12px",
                  }}
                >
                  <LayoutGrid
                    size={20}
                    style={{
                      color: T.border,
                      display: "block",
                      margin: "0 auto 8px",
                    }}
                  />
                  Select a component to edit its properties
                </div>
              )}
              {!selection && activeTab !== "body" && (
                <PageSetupPanel
                  reportState={reportState}
                  onUpdate={(path, v) =>
                    mutateState((s) => {
                      const p = path.split(".");
                      let o: any = s;
                      p.slice(0, -1).forEach((k) => (o = o[k]));
                      o[p[p.length - 1]] = v;
                      if (path === "page.size" || path === "page.orientation") {
                        const newSize = path === "page.size" ? v : s.page.size;
                        const newOri =
                          path === "page.orientation" ? v : s.page.orientation;
                        const newPgW = getPageWidthMm(newSize, newOri);
                        const oldPgW = getPageWidthMm(
                          path === "page.size"
                            ? reportState.page.size
                            : s.page.size,
                          path === "page.orientation"
                            ? reportState.page.orientation
                            : s.page.orientation
                        );
                        if (oldPgW <= 0 || newPgW === oldPgW) return;
                        const contentW =
                          newPgW -
                          (s.page.margin.left || 0) -
                          (s.page.margin.right || 0);
                        for (const zk of ["header", "footer"] as const) {
                          const z = s.page[zk];
                          z.elements = z.elements.map((el: ZoneElement) => {
                            const n = deepClone(el);
                            if (el.type === "LOGO") {
                              const logoW = n.config.width || 0;
                              const logoX = n.config.x || 0;
                              if (logoX + logoW > contentW)
                                n.config.x = Math.max(0, contentW - logoW);
                            } else if (n.config.flexmove) {
                              const elW = n.config.width || 0;
                              const elX = n.config.x || 0;
                              if (elX + elW > contentW)
                                n.config.x = Math.max(0, contentW - elW);
                            }
                            return n;
                          });
                        }
                      }
                    })
                  }
                />
              )}
            </div>
            <div
              style={{
                padding: "8px 14px",
                borderTop: `1px solid ${T.border}`,
                background: T.bg,
                flexShrink: 0,
              }}
            >
              {/* <div style={{ fontSize: 9, color: "#cbd5e1", lineHeight: 1.7 }}>
              💡 Use + Add in each tab to add elements<br />
              ✦ Drag LOGO / Flexmove items · Right-click any element for options<br />
              ⌨️ Del = delete · F = fit page · Ctrl+Z = undo · Ctrl+Y = redo
            </div> */}
            </div>
          </div>
        </div>

        {isJsonModalOpen && (
          <JsonExportModal
            data={buildReportJson(reportState)}
            onClose={() => setIsJsonModalOpen(false)}
          />
        )}
        {showTemplates && (
          <TemplateModal
            onClose={() => setShowTemplates(false)}
            onApply={applyTemplate}
          />
        )}
        {showPdfModal && (
          <PdfPreviewModal
            reportState={reportState}
            onClose={() => setShowPdfModal(false)}
          />
        )}

        {ctxMenu &&
          (() => {
            const ctxEl = reportState.page[ctxMenu.zone]?.elements?.find(
              (e: ZoneElement) => e._id === ctxMenu.elId
            );
            if (!ctxEl) {
              setCtxMenu(null);
              return null;
            }
            const handleLogoUpload = () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/png,image/jpeg";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                if (file.type !== "image/png" && file.type !== "image/jpeg") {
                  alert("Only PNG and JPEG files are supported.");
                  return;
                }
                if (file.size > 1024 * 1024) {
                  alert(
                    `File is ${(file.size / 1024).toFixed(
                      0
                    )} KB — maximum allowed is 1 MB.`
                  );
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = String(reader.result || "");
                  updateZoneElement(ctxMenu.zone, {
                    ...ctxEl,
                    config: { ...ctxEl.config, path: dataUrl },
                  });
                  setCtxMenu(null);
                };
                reader.onerror = () => alert("Failed to read the file.");
                reader.readAsDataURL(file);
              };
              input.click();
            };
            return (
              <ContextMenu
                menu={ctxMenu}
                onClose={() => setCtxMenu(null)}
                isHidden={!!ctxEl.hidden}
                isLocked={!!ctxEl.locked}
                onHide={() => toggleElementHidden(ctxMenu.zone, ctxMenu.elId)}
                onLock={() => toggleElementLocked(ctxMenu.zone, ctxMenu.elId)}
                onDuplicate={() =>
                  duplicateZoneElement(ctxMenu.zone, ctxMenu.elId)
                }
                onDelete={() => deleteZoneElement(ctxMenu.zone, ctxMenu.elId)}
                onZOrder={(dir) =>
                  zOrderZoneElement(ctxMenu.zone, ctxMenu.elId, dir)
                }
                onUploadLogo={
                  ctxEl.type === "LOGO" ? handleLogoUpload : undefined
                }
              />
            );
          })()}

        {bodyCtxMenu &&
          (() => {
            const bc = reportState.bodyComponents.find(
              (c) => c._id === bodyCtxMenu.compId
            );
            if (!bc) {
              setBodyCtxMenu(null);
              return null;
            }
            const handleImageUpload = () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/png,image/jpeg";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                if (file.type !== "image/png" && file.type !== "image/jpeg") {
                  alert("Only PNG and JPEG files are supported.");
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  alert(
                    `File is ${(file.size / (1024 * 1024)).toFixed(
                      1
                    )} MB — max 5 MB.`
                  );
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  updateBodyComp({
                    ...bc,
                    imagePath: String(reader.result || ""),
                  });
                  setBodyCtxMenu(null);
                };
                reader.onerror = () => alert("Failed to read the file.");
                reader.readAsDataURL(file);
              };
              input.click();
            };
            return (
              <BodyContextMenu
                menu={bodyCtxMenu}
                onClose={() => setBodyCtxMenu(null)}
                isHidden={!!bc.hidden}
                isLocked={!!bc.locked}
                onHide={() => {
                  toggleBodyHidden(bc._id);
                  setBodyCtxMenu(null);
                }}
                onLock={() => {
                  toggleBodyLocked(bc._id);
                  setBodyCtxMenu(null);
                }}
                onDuplicate={() => {
                  duplicateBodyComp(bc._id);
                  setBodyCtxMenu(null);
                }}
                onDelete={() => {
                  deleteBodyComp(bc._id);
                  setBodyCtxMenu(null);
                }}
                onUploadImage={
                  bc.type === "IMAGE" ? handleImageUpload : undefined
                }
              />
            );
          })()}

        {showImportModal && (
          <ImportJsonModal
            onClose={() => setShowImportModal(false)}
            onImport={(state) => {
              dispatch({ type: "SET_DIRECT", state });
              setShowImportModal(false);
              setSelection(null);
            }}
          />
        )}

        {!dismissedHints["welcome"] &&
          reportState.bodyRows.length === 0 &&
          activeTab === "body" && (
            <div
              style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 500,
                background: "#1e293b",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 16px",
                fontSize: 11,
                boxShadow: "0 8px 24px rgba(0,0,0,.3)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                maxWidth: 420,
              }}
            >
              <span>
                💡 <strong>Get started:</strong> Switch to the{" "}
                <strong>Body</strong> tab → click <strong>+ Add Row</strong> →
                then add a Table, Chart, or Text block
              </span>
              <button
                onClick={() => dismissHint("welcome")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          )}
        {!dismissedHints["snap"] && snapGrid && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 500,
              background: "#2563eb",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 11,
              boxShadow: "0 4px 16px rgba(37,99,235,.4)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Crosshair size={13} />
            Snap-to-grid ON — free-position drag snaps to 5mm grid
            <button
              onClick={() => dismissHint("snap")}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,.7)",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }
);

ReportStudio.displayName = "ReportStudio";

export default ReportStudio;
