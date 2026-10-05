import type { AppState } from "@/features/reportstudio/types/app-state";
import { uid } from "@/features/reportstudio/utils/id";

/**
 * Default starting `AppState`.
 *
 * Used by:
 *   - The reducer's `reset` action (Phase 7).
 *   - `ImportJsonModal`'s deep-merge fallback so any field missing from an
 *     imported file falls back to a sensible default.
 *
 * IDs are generated at module-evaluation time. That's OK because the IDs in
 * `INITIAL_STATE` are only ever cloned via `deepClone` — they never alias
 * across multiple in-memory studio instances.
 */
export const INITIAL_STATE: AppState = {
  compressLevel: 9,
  memoryReduce: true,
  page: {
    size: "A4",
    orientation: "portrait",
    margin: { top: 30, bottom: 30, left: 30, right: 30 },
    header: {
      background: "#EBF2FB",
      fontColor: "#334155",
      minHeight: 60,
      padding: { top: 8, bottom: 8, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      elements: [
        {
          _id: uid(),
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 60,
            height: 45,
            align: "LEFT",
            x: 8,
            y: 4,
            rotation: 0,
            margin: { top: 4, bottom: 4, left: 10, right: 0 },
            flexmove: true,
          },
        },
        {
          _id: uid(),
          type: "TEXT",
          config: {
            text: "Janata Bank PLC",
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 18,
            fontColor: "#1e3a5f",
            align: "CENTER",
            margin: { top: 2, bottom: 0, left: 0, right: 0 },
          },
        },
        {
          _id: uid(),
          type: "TEXT",
          config: {
            text: "Report main title 2026",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 13,
            fontColor: "#2563eb",
            align: "CENTER",
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
          },
        },
        {
          _id: uid(),
          type: "TEXT",
          config: {
            text: "The subtitle of the report",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 9,
            fontColor: "#64748b",
            align: "CENTER",
            margin: { top: 0, bottom: 2, left: 0, right: 0 },
          },
        },
        {
          _id: uid(),
          type: "SEPARATOR",
          config: {
            show: true,
            height: 1.5,
            color: "#2563eb",
            margin: { top: 2, bottom: 0, left: 8, right: 8 },
          },
        },
        {
          _id: uid(),
          type: "DATE_TIME",
          config: {
            text: "Generated: ",
            format: "yyyy-MM-dd HH:mm:ss",
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "RIGHT",
            margin: { top: 2, bottom: 0, left: 0, right: 6 },
          },
        },
      ],
    },
    footer: {
      height: 28,
      minHeight: 28,
      background: "#EBF2FB",
      fontColor: "#555",
      padding: { top: 4, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      elements: [
        {
          _id: uid(),
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#2563eb",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
          _id: uid(),
          type: "TEXT",
          config: {
            text: "Confidential — Internal Use Only",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 8, right: 0 },
          },
        },
        {
          _id: uid(),
          type: "PAGE_NUMBER",
          config: {
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 8 },
          },
        },
      ],
    },
  },
  bodyRows: [],
  bodyComponents: [],
};
