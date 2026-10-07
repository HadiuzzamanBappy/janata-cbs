import type { Column } from "../types/table";
import type { ZoneElement, ZoneRow } from "../types/zone";
import { uid } from "../utils/id";

/**
 * Static data + presets that the studio falls back on at design time when no
 * user-supplied datasource is available. None of these contents are
 * user-editable — they're effectively config baked into the build.
 */

/** Element palette shown in the left sidebar for header/footer zones. */
export const PALETTE = [
  {
    type: "TEXT",
    label: "Text",
    color: "#2563eb",
    zone: true,
    defaultConfig: {
      text: "Text",
      fontSize: 10,
      align: "LEFT",
      fontColor: "#333333",
    },
  },
  {
    type: "LOGO",
    label: "Logo",
    color: "#059669",
    zone: true,
    defaultConfig: { x: 0, y: 0, width: 60, height: 45 },
  },
  {
    type: "SEPARATOR",
    label: "Line",
    color: "#64748b",
    zone: true,
    defaultConfig: {
      color: "#cccccc",
      height: 0.5,
      widthPct: 100,
      align: "LEFT",
    },
  },
  {
    type: "DATE_TIME",
    label: "DateTime",
    color: "#d97706",
    zone: true,
    defaultConfig: { text: "", fontSize: 9, align: "LEFT", fontColor: "#666666" },
  },
  {
    type: "PAGE_NUMBER",
    label: "Page No.",
    color: "#7c3aed",
    zone: true,
    defaultConfig: { fontSize: 9, align: "RIGHT", fontColor: "#666666" },
  },
];

/** Default config blocks consumed when a fresh element of each type is added. */
export const DEFAULT_ELEMENT_CONFIG: Record<string, any> = {
  TEXT: {
    text: "New Text",
    font: "HELVETICA",
    bold: false,
    italic: false,
    fontSize: 12,
    fontColor: "#222222",
    align: "CENTER",
    margin: { top: 2, bottom: 2, left: 0, right: 0 },
  },
  LOGO: {
    path: "logo.png",
    width: 60,
    height: 45,
    align: "LEFT",
    x: 8,
    y: 4,
    rotation: 0,
    margin: { top: 4, bottom: 4, left: 8, right: 0 },
    flexmove: true,
  },
  SEPARATOR: {
    show: true,
    height: 0.8,
    color: "#aaaaaa",
    margin: { top: 3, bottom: 3, left: 0, right: 0 },
  },
  DATE_TIME: {
    text: "Generated: ",
    format: "yyyy-MM-dd HH:mm:ss",
    font: "HELVETICA",
    fontSize: 9,
    fontColor: "#666666",
    align: "RIGHT",
    margin: { top: 2, bottom: 2, left: 0, right: 4 },
  },
  PAGE_NUMBER: {
    font: "HELVETICA",
    fontSize: 9,
    fontColor: "#666666",
    align: "CENTER",
    margin: { top: 2, bottom: 2, left: 0, right: 0 },
  },
};

/**
 * Preview data — last-resort fallback the table/chart components render when
 * no user-supplied datasource is bound. Sample data also reused by
 * `data/resolveCompData` priority-4.
 */
export const PREVIEW_DATA_ROWS = [
  {
    serial: 1,
    name: "Anika Rahman",
    email: "anika@bank.com",
    age: 32,
    gender: "Female",
    profession: "Software Engineer",
    salary: 8500000,
  },
  {
    serial: 2,
    name: "Karim Hossain",
    email: "karim@bank.com",
    age: 45,
    gender: "Male",
    profession: "Product Manager",
    salary: 5200000,
  },
  {
    serial: 3,
    name: "Nusrat Jahan",
    email: "nusrat@bank.com",
    age: 28,
    gender: "Female",
    profession: "UX Designer",
    salary: 4800000,
  },
  {
    serial: 4,
    name: "Rakib Ahmed",
    email: "rakib@bank.com",
    age: 38,
    gender: "Male",
    profession: "Data Analyst",
    salary: 9200000,
  },
  {
    serial: 5,
    name: "Fatema Begum",
    email: "fatema@bank.com",
    age: 41,
    gender: "Female",
    profession: "HR Manager",
    salary: 7100000,
  },
  {
    serial: 6,
    name: "Tanvir Islam",
    email: "tanvir@bank.com",
    age: 35,
    gender: "Male",
    profession: "DevOps Engineer",
    salary: 6800000,
  },
  {
    serial: 7,
    name: "Sadia Sultana",
    email: "sadia@bank.com",
    age: 29,
    gender: "Female",
    profession: "QA Engineer",
    salary: 4500000,
  },
  {
    serial: 8,
    name: "Mahbub Alam",
    email: "mahbub@bank.com",
    age: 52,
    gender: "Male",
    profession: "Branch Manager",
    salary: 11200000,
  },
  {
    serial: 9,
    name: "Ripa Akter",
    email: "ripa@bank.com",
    age: 26,
    gender: "Female",
    profession: "Frontend Developer",
    salary: 3900000,
  },
  {
    serial: 10,
    name: "Zahir Uddin",
    email: "zahir@bank.com",
    age: 48,
    gender: "Male",
    profession: "Chief Accountant",
    salary: 9800000,
  },
];

/** Auto-populated sample data per component type (v5.2 monolith feature). */
export const SAMPLE_DATA_BY_TYPE: Record<string, any[]> = {
  TABLE: [
    { id: 1, name: "Alice Johnson", department: "Engineering", salary: 95000, status: "Active" },
    { id: 2, name: "Bob Smith", department: "Marketing", salary: 72000, status: "Active" },
    { id: 3, name: "Carol Davis", department: "Sales", salary: 88000, status: "On Leave" },
    { id: 4, name: "David Brown", department: "Engineering", salary: 102000, status: "Active" },
    { id: 5, name: "Emma Wilson", department: "HR", salary: 68000, status: "Active" },
    { id: 6, name: "Frank Miller", department: "Sales", salary: 91000, status: "Active" },
    { id: 7, name: "Grace Lee", department: "Engineering", salary: 97000, status: "Active" },
    { id: 8, name: "Henry Taylor", department: "Marketing", salary: 75000, status: "Active" },
  ],
  CHART: [
    { category: "Jan", value: 45000, target: 42000 },
    { category: "Feb", value: 52000, target: 48000 },
    { category: "Mar", value: 48000, target: 50000 },
    { category: "Apr", value: 61000, target: 55000 },
    { category: "May", value: 58000, target: 57000 },
    { category: "Jun", value: 67000, target: 60000 },
  ],
  IMAGE: [],
  TEXT_BLOCK: [],
};

/**
 * Default column set for a brand-new TABLE body component. Generated
 * lazily via a function so each call creates fresh `_id`s — the monolith
 * relied on `generateId()` running at module-evaluation time which was
 * fine for one set, but the refactored studio creates new tables on demand
 * so we expose a factory instead.
 */
export const makeDefaultTableColumns = (): Column[] => [
  {
    _id: uid(),
    header: "ID",
    dataKey: "id",
    headerPreset: "bold",
    align: "CENTER",
    width: 15,
    format: null,
  },
  {
    _id: uid(),
    header: "Employee Name",
    dataKey: "name",
    headerPreset: "bold",
    align: "LEFT",
    width: 40,
    format: null,
  },
  {
    _id: uid(),
    header: "Department",
    dataKey: "department",
    headerPreset: "bold",
    align: "LEFT",
    width: 30,
    format: null,
  },
  {
    _id: uid(),
    header: "Salary",
    dataKey: "salary",
    headerPreset: "bold",
    align: "RIGHT",
    width: 25,
    format: "CURRENCY",
    decimals: 0,
  },
  {
    _id: uid(),
    header: "Status",
    dataKey: "status",
    headerPreset: "bold",
    align: "CENTER",
    width: 20,
    format: null,
  },
];

/**
 * Legacy column-name → field-key mapping used by the table column resolver
 * (priority 2) when a header label doesn't auto-match a datasource field.
 * Preserve casing — keys here are matched verbatim.
 */
export const COLUMN_DATA_KEY_MAP: Record<string, string> = {
  "SL#": "serial",
  "Employee Name": "employee-name",
  Email: "email",
  Age: "age",
  Gender: "gender",
  Profession: "profession",
  Salary: "salary",
};

/* ──────────────────────────────────────────────────────────────────────
   REPORT TEMPLATES — pre-designed header/footer layouts
   ────────────────────────────────────────────────────────────────────── */

/** Names baked into every template — edit once, apply to all six. */
export const TEMPLATE_DEFAULTS = {
  orgName: "Janata Bank PLC",
  orgShortName: "Janata Bank",
  confidential: "Confidential",
};

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  previewBg: string;
  page: {
    size: string;
    orientation: string;
    margin: { top: number; bottom: number; left: number; right: number };
  };
  header: {
    background: string;
    fontColor: string;
    minHeight: number;
    padding: { top: number; bottom: number; left: number; right: number };
    margin: { top: number; bottom: number; left: number; right: number };
    radius: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
    elements: Omit<ZoneElement, "_id">[];
    rows?: ZoneRow[];
  };
  footer: {
    background: string;
    fontColor: string;
    height: number;
    minHeight: number;
    padding: { top: number; bottom: number; left: number; right: number };
    margin: { top: number; bottom: number; left: number; right: number };
    radius: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
    elements: Omit<ZoneElement, "_id">[];
    rows?: ZoneRow[];
  };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  /* 1. CLASSIC CENTRED — default, logo top-left, centred title stack */
  {
    id: "classic-centred",
    name: "Classic Centred",
    description:
      "Logo top-left · centred title, subtitle, department · separator · date — balanced and formal",
    accent: "#2563eb",
    previewBg: "#EBF2FB",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 30, bottom: 30, left: 30, right: 30 },
    },
    header: {
      background: "#EBF2FB",
      fontColor: "#334155",
      minHeight: 93,
      padding: { top: 8, bottom: 8, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 60,
            height: 45,
            x: 8,
            y: 4,
            rotation: 0,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            flexmove: true,
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
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
          type: "TEXT",
          config: {
            text: "Report Title",
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
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
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
          type: "SEPARATOR",
          config: {
            show: true,
            height: 1.5,
            color: "#2563eb",
            margin: { top: 2, bottom: 0, left: 8, right: 8 },
          },
        },
        {
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
      background: "#EBF2FB",
      fontColor: "#555",
      height: 34,
      minHeight: 34,
      padding: { top: 4, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#2563eb",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
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

  /* 2. LEFT-ALIGNED LOGO — editorial, all text left */
  {
    id: "left-aligned",
    name: "Left Aligned",
    description: "Logo top-left · all text left-aligned · modern editorial style · date right",
    accent: "#059669",
    previewBg: "#ECFDF5",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 30, bottom: 30, left: 30, right: 30 },
    },
    header: {
      background: "#ECFDF5",
      fontColor: "#064e3b",
      minHeight: 91,
      padding: { top: 8, bottom: 8, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 55,
            height: 42,
            x: 8,
            y: 5,
            rotation: 0,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            flexmove: true,
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 18,
            fontColor: "#064e3b",
            align: "LEFT",
            margin: { top: 2, bottom: 0, left: 72, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Report Title",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 12,
            fontColor: "#059669",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 72, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 9,
            fontColor: "#6b7280",
            align: "LEFT",
            margin: { top: 0, bottom: 2, left: 72, right: 0 },
          },
        },
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 1.5,
            color: "#059669",
            margin: { top: 2, bottom: 0, left: 0, right: 0 },
          },
        },
        {
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
      background: "#ECFDF5",
      fontColor: "#064e3b",
      height: 34,
      minHeight: 34,
      padding: { top: 4, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#059669",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName} — ${TEMPLATE_DEFAULTS.confidential}`,
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

  /* 3. EXECUTIVE DARK */
  {
    id: "executive-dark",
    name: "Executive Dark",
    description:
      "Dark header · white logo top-left · org name large left · title right · accent separator",
    accent: "#1e40af",
    previewBg: "#1e293b",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 30, bottom: 30, left: 30, right: 30 },
    },
    header: {
      background: "#1e293b",
      fontColor: "#f1f5f9",
      minHeight: 64,
      padding: { top: 10, bottom: 8, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 56,
            height: 42,
            x: 10,
            y: 6,
            rotation: 0,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            flexmove: true,
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 18,
            fontColor: "#f1f5f9",
            align: "LEFT",
            margin: { top: 0, bottom: 2, left: 76, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 9,
            fontColor: "#94a3b8",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 76, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Report Title",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 13,
            fontColor: "#93c5fd",
            align: "RIGHT",
            margin: { top: 0, bottom: 2, left: 0, right: 10 },
          },
        },
        {
          type: "DATE_TIME",
          config: {
            text: "",
            format: "dd MMM yyyy",
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#475569",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 10 },
          },
        },
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 2,
            color: "#3b82f6",
            margin: { top: 6, bottom: 0, left: 0, right: 0 },
          },
        },
      ],
    },
    footer: {
      background: "#1e293b",
      fontColor: "#64748b",
      height: 26,
      minHeight: 26,
      padding: { top: 3, bottom: 3, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#3b82f6",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.confidential} — ${TEMPLATE_DEFAULTS.orgName}`,
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 8,
            fontColor: "#475569",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 10, right: 0 },
          },
        },
        {
          type: "PAGE_NUMBER",
          config: {
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#475569",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 10 },
          },
        },
      ],
    },
  },

  /* 4. FORMAL CENTRED — no logo */
  {
    id: "formal-centred",
    name: "Formal Centred",
    description:
      "Thick top accent bar · no logo · centred title hierarchy · formal government style",
    accent: "#7c3aed",
    previewBg: "#F5F3FF",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 18, bottom: 18, left: 28, right: 28 },
    },
    header: {
      background: "#F5F3FF",
      fontColor: "#2e1065",
      minHeight: 100,
      padding: { top: 0, bottom: 6, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 5,
            color: "#7c3aed",
            margin: { top: 0, bottom: 10, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 20,
            fontColor: "#2e1065",
            align: "CENTER",
            margin: { top: 0, bottom: 2, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Report Title",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 12,
            fontColor: "#7c3aed",
            align: "CENTER",
            margin: { top: 0, bottom: 1, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 9,
            fontColor: "#6d28d9",
            align: "CENTER",
            margin: { top: 0, bottom: 4, left: 0, right: 0 },
          },
        },
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#a78bfa",
            margin: { top: 0, bottom: 0, left: 20, right: 20 },
          },
        },
        {
          type: "DATE_TIME",
          config: {
            text: "Generated: ",
            format: "yyyy-MM-dd HH:mm:ss",
            font: "HELVETICA",
            fontSize: 7.5,
            fontColor: "#94a3b8",
            align: "CENTER",
            margin: { top: 3, bottom: 0, left: 0, right: 0 },
          },
        },
      ],
    },
    footer: {
      background: "#F5F3FF",
      fontColor: "#6d28d9",
      height: 34,
      minHeight: 34,
      padding: { top: 4, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.8,
            color: "#a78bfa",
            margin: { top: 0, bottom: 3, left: 20, right: 20 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.confidential} — ${TEMPLATE_DEFAULTS.orgName}`,
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
          type: "PAGE_NUMBER",
          config: {
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#7c3aed",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 8 },
          },
        },
      ],
    },
  },

  /* 5. COMPACT HEADER */
  {
    id: "compact",
    name: "Compact",
    description:
      "Short header · small logo · tight left stack · right-aligned meta · ideal for data reports",
    accent: "#dc2626",
    previewBg: "#FEF2F2",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 16, bottom: 16, left: 28, right: 28 },
    },
    header: {
      background: "#FEF2F2",
      fontColor: "#450a0a",
      minHeight: 50,
      padding: { top: 6, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 44,
            height: 33,
            x: 6,
            y: 4,
            rotation: 0,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            flexmove: true,
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 15,
            fontColor: "#450a0a",
            align: "LEFT",
            margin: { top: 2, bottom: 0, left: 56, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Report Title",
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 10,
            fontColor: "#dc2626",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 56, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 8,
            fontColor: "#6b7280",
            align: "RIGHT",
            margin: { top: 2, bottom: 0, left: 0, right: 6 },
          },
        },
        {
          type: "DATE_TIME",
          config: {
            text: "",
            format: "yyyy-MM-dd",
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 6 },
          },
        },
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 1,
            color: "#dc2626",
            margin: { top: 4, bottom: 0, left: 0, right: 0 },
          },
        },
      ],
    },
    footer: {
      background: "#ffffff",
      fontColor: "#450a0a",
      height: 22,
      minHeight: 22,
      padding: { top: 3, bottom: 3, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 0.5,
            color: "#fca5a5",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.confidential} — ${TEMPLATE_DEFAULTS.orgName}`,
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 7.5,
            fontColor: "#94a3b8",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 6, right: 0 },
          },
        },
        {
          type: "PAGE_NUMBER",
          config: {
            font: "HELVETICA",
            fontSize: 7.5,
            fontColor: "#dc2626",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 6 },
          },
        },
      ],
    },
  },

  /* 6. SPLIT HEADER */
  {
    id: "split-header",
    name: "Split Header",
    description: "Logo + org name LEFT · report title + date RIGHT · three-column footer",
    accent: "#d97706",
    previewBg: "#FFFBEB",
    page: {
      size: "A4",
      orientation: "portrait",
      margin: { top: 30, bottom: 30, left: 30, right: 30 },
    },
    header: {
      background: "#FFFBEB",
      fontColor: "#78350f",
      minHeight: 64,
      padding: { top: 8, bottom: 8, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "LOGO",
          config: {
            path: "logo.png",
            width: 55,
            height: 42,
            x: 8,
            y: 4,
            rotation: 0,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            flexmove: true,
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "TIMES",
            bold: true,
            italic: false,
            fontSize: 17,
            fontColor: "#78350f",
            align: "LEFT",
            margin: { top: 2, bottom: 1, left: 72, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Department / Sub-title",
            font: "HELVETICA",
            bold: false,
            italic: true,
            fontSize: 9,
            fontColor: "#92400e",
            align: "LEFT",
            margin: { top: 0, bottom: 2, left: 72, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: "Report Title",
            font: "HELVETICA",
            bold: true,
            italic: false,
            fontSize: 13,
            fontColor: "#d97706",
            align: "RIGHT",
            margin: { top: 2, bottom: 1, left: 0, right: 8 },
          },
        },
        {
          type: "DATE_TIME",
          config: {
            text: "Date: ",
            format: "dd MMM yyyy",
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "RIGHT",
            margin: { top: 0, bottom: 2, left: 0, right: 8 },
          },
        },
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 2,
            color: "#d97706",
            margin: { top: 2, bottom: 0, left: 0, right: 0 },
          },
        },
      ],
    },
    footer: {
      background: "#FFFBEB",
      fontColor: "#78350f",
      height: 32,
      minHeight: 32,
      padding: { top: 4, bottom: 4, left: 0, right: 0 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      rows: [],
      elements: [
        {
          type: "SEPARATOR",
          config: {
            show: true,
            height: 1.5,
            color: "#fcd34d",
            margin: { top: 0, bottom: 3, left: 0, right: 0 },
          },
        },
        {
          type: "TEXT",
          config: {
            text: `${TEMPLATE_DEFAULTS.orgName}`,
            font: "HELVETICA",
            bold: false,
            italic: false,
            fontSize: 8,
            fontColor: "#b45309",
            align: "LEFT",
            margin: { top: 0, bottom: 0, left: 8, right: 0 },
          },
        },
        {
          type: "DATE_TIME",
          config: {
            text: "",
            format: "yyyy-MM-dd",
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#94a3b8",
            align: "CENTER",
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
          },
        },
        {
          type: "PAGE_NUMBER",
          config: {
            font: "HELVETICA",
            fontSize: 8,
            fontColor: "#d97706",
            align: "RIGHT",
            margin: { top: 0, bottom: 0, left: 0, right: 8 },
          },
        },
      ],
    },
  },
];
