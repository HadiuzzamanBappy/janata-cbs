import { Check, ChevronLeft, ChevronRight, Hash, Palette, RefreshCw, Table2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Toggle } from "../../components/common/Toggle";
import { ColorInput } from "../../components/form/ColorInput";
import { RadiusInput } from "../../components/form/RadiusInput";
import { SpacingInput } from "../../components/form/SpacingInput";
import { PropCell } from "../../components/layout/PropCell";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropSection } from "../../components/layout/PropSection";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { BodyComponent } from "../../types/body";
import type { ReportVariable } from "../../types/text-block";
import { generateId } from "../../utils/id";
import { BodyCompHeader } from "../body/BodyCompHeader";
import { BodyLayoutSection } from "../body/BodyLayoutSection";
import { BODY_COMP_META } from "../body/meta";
import { InlineDataManager } from "../data-sources/InlineDataManager";
import { DEFAULT_TABLE_STYLE } from "./quillTableStyle";

const sel: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

export function TextBlockPropsPanel({
  comp,
  onUpdate,
  onDelete,
  onDuplicate,
  reportVariables,
  onUpdateReportVariables,
  componentDataSources,
  onUpdateComponentDataSources,
  centralData,
  onUpdateCentralData,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  reportVariables?: ReportVariable[];
  onUpdateReportVariables?: (v: ReportVariable[]) => void;
  componentDataSources?: Record<string, any[]>;
  onUpdateComponentDataSources?: (cds: Record<string, any[]>) => void;
  centralData?: Record<string, any[]>;
  onUpdateCentralData?: (cd: Record<string, any[]>) => void;
}) {
  const up = (k: keyof BodyComponent, v: any) => onUpdate({ ...comp, [k]: v });
  const m = BODY_COMP_META.TEXT_BLOCK;

  const allVars = reportVariables || [];
  const allVarsRef = useRef(allVars);
  allVarsRef.current = allVars;

  // ── 1. Scan variable tokens from Quill Delta or paragraphs ──────────
  const usedTokenNames = (() => {
    const names: string[] = [];
    const seen = new Set<string>();
    const TOKEN_RE = /\{\{([^}]+)\}\}|\{\[([^\]]+)\]\}/g;
    const add = (text: string) => {
      TOKEN_RE.lastIndex = 0;
      let m2;
      while ((m2 = TOKEN_RE.exec(text)) !== null) {
        const name = m2[1] || m2[2];
        if (name && !seen.has(name)) {
          seen.add(name);
          names.push(name);
        }
      }
    };
    if (comp.quillDelta?.ops) {
      for (const op of comp.quillDelta.ops) {
        if (typeof op.insert === "string") add(op.insert);
      }
    }
    if (comp.paragraphs) {
      for (const p of comp.paragraphs) add(p.text || "");
    }
    return names;
  })();

  // ── 2. Datasource catalog ─────────────────────────────────────────────
  const dsCatalog: { ref: string; label: string; rows: any[] }[] = [];
  const ownRows = componentDataSources?.[comp._id];
  if (ownRows?.length) {
    dsCatalog.push({
      ref: `comp:${comp._id}`,
      label: `This component (${ownRows.length} rows)`,
      rows: ownRows,
    });
  }
  if (componentDataSources) {
    Object.entries(componentDataSources).forEach(([id, rows]) => {
      if (id !== comp._id && Array.isArray(rows) && rows.length > 0)
        dsCatalog.push({
          ref: `comp:${id}`,
          label: `Component [${id.slice(0, 7)}] (${rows.length} rows)`,
          rows,
        });
    });
  }
  if (centralData) {
    Object.entries(centralData).forEach(([key, rows]) => {
      if (Array.isArray(rows) && rows.length > 0)
        dsCatalog.push({
          ref: `central:${key}`,
          label: `Central: ${key} (${rows.length} rows)`,
          rows,
        });
    });
  }

  const getRows = (ref: string) => dsCatalog.find((d) => d.ref === ref)?.rows ?? [];
  const getFirstRow = (ref: string) => getRows(ref)[0] ?? null;
  const getCols = (ref: string) => {
    const row = getFirstRow(ref);
    return row ? Object.keys(row) : [];
  };

  // ── 3. Upsert / delete variables ──────────────────────────────────────
  const upsertVar = useCallback(
    (name: string, patch: Partial<ReportVariable>) => {
      if (!onUpdateReportVariables) return;
      const current = allVarsRef.current;
      const idx = current.findIndex((v) => v.name === name);
      if (idx >= 0) {
        onUpdateReportVariables(current.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
      } else {
        onUpdateReportVariables([
          ...current,
          {
            _id: generateId(),
            name,
            dataSourceRef: "",
            columnKey: "",
            staticValue: "",
            ...patch,
          },
        ]);
      }
    },
    [onUpdateReportVariables],
  );

  const deleteVar = useCallback(
    (name: string) => {
      onUpdateReportVariables?.(allVarsRef.current.filter((v) => v.name !== name));
    },
    [onUpdateReportVariables],
  );

  const [activeToken, setActiveToken] = useState<string | null>(null);
  const resolvedActive = usedTokenNames.includes(activeToken ?? "")
    ? activeToken
    : (usedTokenNames[0] ?? null);
  const activeIdx = usedTokenNames.indexOf(resolvedActive ?? "");

  const activeEntry = allVars.find((v) => v.name === resolvedActive);
  const activeDsRef = activeEntry?.dataSourceRef ?? "";
  const activeColKey = activeEntry?.columnKey ?? "";
  const activeStatic = activeEntry?.staticValue ?? "";
  const activeCols = getCols(activeDsRef);
  const activeRow = getFirstRow(activeDsRef);
  const activeIsMapped = !!(activeDsRef && activeColKey);
  const activeColMissing = !!(activeColKey && activeRow && !(activeColKey in activeRow));
  const activePreview =
    activeRow && activeColKey && !activeColMissing
      ? String(activeRow[activeColKey] ?? "")
      : activeStatic || null;

  const mappedCount = usedTokenNames.filter((n) => {
    const ve = allVars.find((v) => v.name === n);
    return !!(ve?.dataSourceRef && ve?.columnKey);
  }).length;

  const applyDsToAll = (ref: string) => {
    if (!onUpdateReportVariables) return;
    const current = allVarsRef.current;
    const next = [...current];
    usedTokenNames.forEach((name) => {
      const firstCol = getCols(ref)[0] ?? "";
      const idx2 = next.findIndex((v) => v.name === name);
      if (idx2 >= 0) {
        next[idx2] = {
          ...next[idx2],
          dataSourceRef: ref,
          columnKey: next[idx2].columnKey || firstCol,
        };
      } else {
        next.push({
          _id: generateId(),
          name,
          dataSourceRef: ref,
          columnKey: firstCol,
          staticValue: "",
        });
      }
    });
    onUpdateReportVariables(next);
  };

  const autoMapByName = (ref: string) => {
    if (!onUpdateReportVariables || !ref) return;
    const cols = getCols(ref);
    const current = allVarsRef.current;
    const next = [...current];
    usedTokenNames.forEach((name) => {
      const matchCol = cols.find((c) => c.toLowerCase() === name.toLowerCase()) ?? "";
      if (!matchCol) return;
      const idx2 = next.findIndex((v) => v.name === name);
      if (idx2 >= 0) {
        next[idx2] = { ...next[idx2], dataSourceRef: ref, columnKey: matchCol };
      } else {
        next.push({
          _id: generateId(),
          name,
          dataSourceRef: ref,
          columnKey: matchCol,
          staticValue: "",
        });
      }
    });
    onUpdateReportVariables(next);
  };

  const autoMapCount = (ref: string) => {
    const cols = getCols(ref);
    return usedTokenNames.filter((n) => cols.some((c) => c.toLowerCase() === n.toLowerCase()))
      .length;
  };

  return (
    <div style={{ fontSize: 11 }}>
      <BodyCompHeader
        comp={comp}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        color={m.color}
        Icon={m.Icon}
      />

      {/* ── Container ── */}
      <PropSection
        label="Container"
        color={m.color}
        icon={<Palette size={9} />}
        defaultOpen={false}
      >
        <ColorInput
          label="Background"
          value={comp.textBg || "transparent"}
          onChange={(v) => up("textBg", v)}
        />
        <SpacingInput
          label="Padding"
          value={comp.textPadding || { top: 4, bottom: 4, left: 0, right: 0 }}
          onChange={(v) => up("textPadding", v)}
        />
        <Toggle
          label="Show Border"
          value={!!comp.textBorderEnabled}
          onChange={(v) => up("textBorderEnabled", v)}
        />
        {comp.textBorderEnabled && (
          <>
            <ColorInput
              label="Border Color"
              value={comp.textBorderColor || "#e2e8f0"}
              onChange={(v) => up("textBorderColor", v)}
            />
            <PropGrid2>
              <PropCell
                label="Width"
                value={comp.textBorderWidth ?? 1}
                onChange={(v) => up("textBorderWidth", +v)}
                min={0.5}
                step={0.5}
              />
              <div>
                <div
                  style={{
                    fontSize: 8,
                    color: T.muted,
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Style
                </div>
                <select
                  style={sel}
                  value={comp.textBorderStyle || "solid"}
                  onChange={(e) => up("textBorderStyle", e.target.value)}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </PropGrid2>
            <RadiusInput
              value={
                comp.textRadius || {
                  topLeft: 0,
                  topRight: 0,
                  bottomLeft: 0,
                  bottomRight: 0,
                }
              }
              onChange={(v) => up("textRadius", v)}
              color={m.color}
            />
          </>
        )}
      </PropSection>

      {/* ── Variable Mapping ── */}
      <PropSection
        label={
          usedTokenNames.length > 0
            ? `Variable Mapping (${mappedCount}/${usedTokenNames.length})`
            : "Variable Mapping"
        }
        color="#d97706"
        icon={<Hash size={9} />}
      >
        {usedTokenNames.length === 0 ? (
          <div
            style={{
              fontSize: 9,
              color: "#92400e",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 6,
              padding: "12px 10px",
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 5 }}>🔖</div>
            Type{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "#fef3c7",
                borderRadius: 2,
                padding: "0 4px",
              }}
            >
              {"{{variable_name}}"}
            </code>{" "}
            in the editor.
            <br />
            All tokens appear here automatically for mapping.
          </div>
        ) : (
          <div>
            {/* Inline dataset manager */}
            <InlineDataManager
              centralData={centralData}
              onUpdateCentralData={onUpdateCentralData}
              componentDataSources={componentDataSources}
              onUpdateComponentDataSources={onUpdateComponentDataSources}
              compId={comp._id}
            />

            {/* Progress bar */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 8.5, color: T.muted }}>
                  {mappedCount} of {usedTokenNames.length} mapped
                </span>
                {mappedCount === usedTokenNames.length && (
                  <span style={{ fontSize: 8, color: "#16a34a", fontWeight: 700 }}>
                    ✓ all mapped
                  </span>
                )}
              </div>
              <div
                style={{
                  height: 4,
                  background: T.border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    transition: "width .3s",
                    width: `${
                      usedTokenNames.length > 0 ? (mappedCount / usedTokenNames.length) * 100 : 0
                    }%`,
                    background: mappedCount === usedTokenNames.length ? "#16a34a" : "#f59e0b",
                  }}
                />
              </div>
            </div>

            {/* Bulk actions */}
            {dsCatalog.length > 0 && (
              <div
                style={{
                  background: "#f8fafc",
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "7px 9px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: T.label,
                    fontWeight: 600,
                    marginBottom: 5,
                  }}
                >
                  Quick actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {dsCatalog.map((d) => {
                    const matchable = autoMapCount(d.ref);
                    return (
                      <div
                        key={d.ref}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: d.ref.startsWith("comp:") ? "#dbeafe" : "#ede9fe",
                            color: d.ref.startsWith("comp:") ? "#1d4ed8" : "#6d28d9",
                          }}
                        >
                          {d.label}
                        </span>
                        <button
                          onClick={() => applyDsToAll(d.ref)}
                          style={{
                            fontSize: 8,
                            padding: "2px 7px",
                            background: T.bg2,
                            border: `1px solid ${T.border}`,
                            borderRadius: 4,
                            cursor: "pointer",
                            color: T.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Apply to all
                        </button>
                        {matchable > 0 && (
                          <button
                            onClick={() => autoMapByName(d.ref)}
                            style={{
                              fontSize: 8,
                              padding: "2px 7px",
                              background: "#fef3c7",
                              border: "1px solid #fde68a",
                              borderRadius: 4,
                              cursor: "pointer",
                              color: "#92400e",
                              whiteSpace: "nowrap",
                              fontWeight: 700,
                            }}
                          >
                            Auto-map ({matchable})
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single mapping panel */}
            <div
              style={{
                background: "#fff",
                border: `1px solid ${T.border}`,
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              {/* Token selector */}
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: `1px solid ${T.border}`,
                  background: "#fffbeb",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <button
                    disabled={activeIdx <= 0}
                    onClick={() => setActiveToken(usedTokenNames[activeIdx - 1])}
                    style={{
                      background: "none",
                      border: `1px solid ${T.border}`,
                      borderRadius: 4,
                      padding: "2px 5px",
                      cursor: activeIdx > 0 ? "pointer" : "default",
                      opacity: activeIdx > 0 ? 1 : 0.3,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronLeft size={11} />
                  </button>
                  <select
                    value={resolvedActive ?? ""}
                    onChange={(e) => setActiveToken(e.target.value)}
                    style={{
                      ...sel,
                      flex: 1,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: 10,
                      color: "#92400e",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                    }}
                  >
                    {usedTokenNames.map((name, i) => {
                      const ve = allVars.find((v) => v.name === name);
                      const mapped = !!(ve?.dataSourceRef && ve?.columnKey);
                      return (
                        <option key={name} value={name}>
                          {mapped ? "✓" : "○"} {`{{${name}}}`} ({i + 1}/{usedTokenNames.length})
                        </option>
                      );
                    })}
                  </select>
                  <button
                    disabled={activeIdx >= usedTokenNames.length - 1}
                    onClick={() => setActiveToken(usedTokenNames[activeIdx + 1])}
                    style={{
                      background: "none",
                      border: `1px solid ${T.border}`,
                      borderRadius: 4,
                      padding: "2px 5px",
                      cursor: activeIdx < usedTokenNames.length - 1 ? "pointer" : "default",
                      opacity: activeIdx < usedTokenNames.length - 1 ? 1 : 0.3,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronRight size={11} />
                  </button>
                  <span
                    style={{
                      fontSize: 8,
                      padding: "2px 7px",
                      borderRadius: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                      background:
                        activeIsMapped && !activeColMissing
                          ? "#dcfce7"
                          : activeColMissing
                            ? "#fef2f2"
                            : "#fef9c3",
                      color:
                        activeIsMapped && !activeColMissing
                          ? "#16a34a"
                          : activeColMissing
                            ? "#dc2626"
                            : "#a16207",
                    }}
                  >
                    {activeIsMapped && !activeColMissing ? "✓" : activeColMissing ? "⚠" : "○"}
                  </span>
                </div>
              </div>

              {/* Mapping fields */}
              {resolvedActive && (
                <div style={{ padding: "10px 11px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 7,
                      marginBottom: 7,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        Datasource
                      </div>
                      {dsCatalog.length > 0 ? (
                        <select
                          value={activeDsRef}
                          style={sel}
                          onChange={(e) => {
                            const ref = e.target.value;
                            upsertVar(resolvedActive, {
                              dataSourceRef: ref,
                              columnKey: getCols(ref)[0] ?? "",
                            });
                          }}
                        >
                          <option value="">— none —</option>
                          {dsCatalog.map((d) => (
                            <option key={d.ref} value={d.ref}>
                              {d.ref.startsWith("central:") ? "⬡ " : "⬢ "}
                              {d.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          style={{
                            fontSize: 8.5,
                            color: T.muted,
                            fontStyle: "italic",
                            padding: "4px 0",
                          }}
                        >
                          No datasources
                        </div>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        Column
                      </div>
                      {activeDsRef && activeCols.length > 0 ? (
                        <select
                          value={activeColKey}
                          style={sel}
                          onChange={(e) =>
                            upsertVar(resolvedActive, {
                              columnKey: e.target.value,
                            })
                          }
                        >
                          <option value="">— none —</option>
                          {activeCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={activeColKey}
                          readOnly={!activeDsRef}
                          placeholder={activeDsRef ? "no cols" : "—"}
                          style={{
                            ...inputStyle,
                            fontFamily: "monospace",
                            background: !activeDsRef ? T.bg2 : undefined,
                            color: T.muted,
                          }}
                          onChange={(e) =>
                            activeDsRef &&
                            upsertVar(resolvedActive, {
                              columnKey: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Fallback */}
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: T.label,
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      Fallback{" "}
                      <span style={{ fontWeight: 400, color: T.muted }}>
                        (shown when no data value)
                      </span>
                    </div>
                    <input
                      value={activeStatic}
                      style={inputStyle}
                      placeholder="e.g. N/A"
                      onChange={(e) =>
                        upsertVar(resolvedActive, {
                          staticValue: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Variable Style */}
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: T.label,
                        fontWeight: 600,
                        marginBottom: 5,
                      }}
                    >
                      Style{" "}
                      <span style={{ fontWeight: 400, color: T.muted }}>
                        (applied to resolved value)
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      {(["bold", "italic", "underline"] as const).map((prop) => {
                        const labels: Record<string, string> = {
                          bold: "B",
                          italic: "I",
                          underline: "U",
                        };
                        const styles: Record<string, React.CSSProperties> = {
                          bold: { fontWeight: 800 },
                          italic: { fontStyle: "italic" },
                          underline: { textDecoration: "underline" },
                        };
                        const active = !!activeEntry?.style?.[prop];
                        return (
                          <button
                            key={prop}
                            onClick={() =>
                              upsertVar(resolvedActive, {
                                style: {
                                  ...(activeEntry?.style || {}),
                                  [prop]: !active,
                                },
                              })
                            }
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 5,
                              cursor: "pointer",
                              fontSize: 11,
                              border: `1px solid ${active ? "#7c3aed" : T.border}`,
                              background: active ? "#ede9fe" : "#fff",
                              color: active ? "#6d28d9" : T.muted,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              ...styles[prop],
                            }}
                          >
                            {labels[prop]}
                          </button>
                        );
                      })}

                      <div style={{ width: 1, height: 20, background: T.border }} />

                      {/* Font size override */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <span style={{ fontSize: 8, color: T.muted }}>Size</span>
                        <input
                          type="number"
                          min={6}
                          max={72}
                          value={activeEntry?.style?.fontSize ?? ""}
                          placeholder="auto"
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            upsertVar(resolvedActive, {
                              style: {
                                ...(activeEntry?.style || {}),
                                fontSize: val,
                              },
                            });
                          }}
                          style={{
                            width: 40,
                            fontSize: 9,
                            padding: "3px 5px",
                            border: `1px solid ${T.border}`,
                            borderRadius: 4,
                            textAlign: "center",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div style={{ width: 1, height: 20, background: T.border }} />

                      {/* Text color */}
                      <label
                        title="Text color"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 8, color: T.muted }}>Color</span>
                        <div
                          style={{
                            position: "relative",
                            width: 24,
                            height: 24,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 5,
                              border: `2px solid ${T.border}`,
                              background: activeEntry?.style?.color || "#374151",
                            }}
                          />
                          <input
                            type="color"
                            value={activeEntry?.style?.color || "#374151"}
                            onChange={(e) =>
                              upsertVar(resolvedActive, {
                                style: {
                                  ...(activeEntry?.style || {}),
                                  color: e.target.value,
                                },
                              })
                            }
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                              border: "none",
                              padding: 0,
                            }}
                          />
                        </div>
                      </label>

                      {/* Highlight */}
                      <label
                        title="Highlight color"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 8, color: T.muted }}>Highlight</span>
                        <div
                          style={{
                            position: "relative",
                            width: 24,
                            height: 24,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 5,
                              border: `2px solid ${T.border}`,
                              background: activeEntry?.style?.background || "transparent",
                              backgroundImage: activeEntry?.style?.background
                                ? "none"
                                : "repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 2px,transparent 0,transparent 6px)",
                            }}
                          />
                          <input
                            type="color"
                            value={activeEntry?.style?.background || "#ffffff"}
                            onChange={(e) =>
                              upsertVar(resolvedActive, {
                                style: {
                                  ...(activeEntry?.style || {}),
                                  background: e.target.value,
                                },
                              })
                            }
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                              border: "none",
                              padding: 0,
                            }}
                          />
                        </div>
                      </label>

                      {activeEntry?.style && Object.keys(activeEntry.style).length > 0 && (
                        <button
                          onClick={() => upsertVar(resolvedActive, { style: {} })}
                          style={{
                            fontSize: 8,
                            padding: "2px 6px",
                            background: "none",
                            border: `1px solid ${T.border}`,
                            borderRadius: 4,
                            cursor: "pointer",
                            color: T.muted,
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Live style preview */}
                    {activeEntry?.style &&
                      Object.keys(activeEntry.style).some((k) => (activeEntry.style as any)[k]) && (
                        <div
                          style={{
                            marginTop: 6,
                            padding: "4px 8px",
                            background: T.bg2,
                            borderRadius: 4,
                            border: `1px solid ${T.border}`,
                            fontSize: 9,
                          }}
                        >
                          Preview:{" "}
                          <span
                            style={{
                              fontWeight: activeEntry.style.bold ? 700 : undefined,
                              fontStyle: activeEntry.style.italic ? "italic" : undefined,
                              textDecoration: activeEntry.style.underline ? "underline" : undefined,
                              color: activeEntry.style.color || undefined,
                              fontSize: activeEntry.style.fontSize
                                ? `${activeEntry.style.fontSize * 0.8}px`
                                : undefined,
                              background: activeEntry.style.background || undefined,
                              padding: activeEntry.style.background ? "0 3px" : undefined,
                              borderRadius: activeEntry.style.background ? "2px" : undefined,
                            }}
                          >
                            {activePreview || `{{${resolvedActive}}}`}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Result row */}
                  {activePreview !== null && !activeColMissing && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 5,
                        padding: "5px 9px",
                        fontSize: 9,
                        color: "#166534",
                      }}
                    >
                      <Check size={9} color="#16a34a" />
                      <code
                        style={{ fontFamily: "monospace", color: "#92400e" }}
                      >{`{{${resolvedActive}}}`}</code>
                      <span style={{ color: T.muted }}>→</span>
                      <strong style={{ fontFamily: "monospace" }}>{activePreview}</strong>
                    </div>
                  )}
                  {!activeIsMapped && !activePreview && (
                    <div
                      style={{
                        fontSize: 8.5,
                        color: T.muted,
                        background: T.bg2,
                        border: `1px solid ${T.border}`,
                        borderRadius: 5,
                        padding: "5px 9px",
                      }}
                    >
                      Select a datasource and column to map this token.
                    </div>
                  )}
                  {activeColMissing && (
                    <div
                      style={{
                        fontSize: 8.5,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 5,
                        padding: "5px 9px",
                      }}
                    >
                      ⚠ Column <code style={{ fontFamily: "monospace" }}>{activeColKey}</code> not
                      found in datasource
                    </div>
                  )}

                  {/* Footer: clear + navigate next unmapped */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                      paddingTop: 7,
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    {activeEntry ? (
                      <button
                        onClick={() => deleteVar(resolvedActive)}
                        style={{
                          fontSize: 8.5,
                          color: "#dc2626",
                          background: "none",
                          border: "1px solid #fecaca",
                          borderRadius: 4,
                          padding: "2px 9px",
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    ) : (
                      <span />
                    )}
                    {(() => {
                      const nextUnmapped = usedTokenNames.find((n, i) => {
                        if (i <= activeIdx) return false;
                        const ve = allVars.find((v) => v.name === n);
                        return !(ve?.dataSourceRef && ve?.columnKey);
                      });
                      return nextUnmapped ? (
                        <button
                          onClick={() => setActiveToken(nextUnmapped)}
                          style={{
                            fontSize: 8.5,
                            color: "#d97706",
                            background: "none",
                            border: "1px solid #fde68a",
                            borderRadius: 4,
                            padding: "2px 9px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          Next unmapped <ChevronRight size={9} />
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </PropSection>

      {/* ── Table Data Binding ── */}
      {(() => {
        const tableOps: { idx: number; numCols: number; headers: string[] }[] = [];
        if (comp.quillDelta?.ops) {
          let tIdx = 0;
          (comp.quillDelta.ops as any[]).forEach((op: any) => {
            if (op.insert?.["table-embed"]) {
              const val = op.insert["table-embed"];
              const rows: string[][] = val?.rows || [];
              const firstRow = rows[0] || [];
              tableOps.push({
                idx: tIdx,
                numCols: firstRow.length,
                headers: firstRow,
              });
              tIdx++;
            }
          });
        }
        if (tableOps.length === 0) return null;

        return (
          <PropSection
            label={`Table Data (${tableOps.length})`}
            color="#0891b2"
            icon={<Table2 size={9} />}
          >
            {tableOps.map(({ idx, numCols, headers }) => {
              const binding = ((comp.tableBindings || {}) as any)[idx] || {
                dsRef: "",
                arrayField: "",
                colMap: [],
              };
              const colMapArr: string[] = Array.isArray(binding.colMap) ? binding.colMap : [];

              const updateBinding = (patch: any) => {
                up("tableBindings", {
                  ...(comp.tableBindings || {}),
                  [idx]: { ...binding, ...patch },
                });
              };

              const parentRows = getRows(binding.dsRef);
              const firstParentRow = parentRows[0] ?? null;
              const arrayFields = firstParentRow
                ? Object.entries(firstParentRow)
                    .filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0)
                    .map(([k, v]) => ({ key: k, rows: v as any[] }))
                : [];
              const childRows: any[] =
                binding.arrayField && firstParentRow
                  ? (firstParentRow[binding.arrayField] as any[]) || []
                  : [];
              const childCols = childRows.length > 0 ? Object.keys(childRows[0]) : [];
              const colMappedCount = colMapArr.filter((f) => f && f !== "").length;

              return (
                <div key={idx}>
                  {tableOps.length > 1 && (
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#0891b2",
                        marginBottom: 6,
                      }}
                    >
                      Table {idx + 1}
                    </div>
                  )}

                  {/* Font size control — always visible, no datasource needed */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      padding: "5px 8px",
                      background: T.bg2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 5,
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 9,
                        color: T.label,
                        fontWeight: 600,
                      }}
                    >
                      Font size (pt)
                    </span>
                    <input
                      type="number"
                      min={7}
                      max={36}
                      step={1}
                      value={binding.style?.fontSize ?? DEFAULT_TABLE_STYLE.fontSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateBinding({
                          style: {
                            ...DEFAULT_TABLE_STYLE,
                            ...(binding.style || {}),
                            fontSize: val,
                          },
                        });
                      }}
                      style={{
                        width: 52,
                        padding: "3px 5px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 4,
                        fontSize: 11,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 8, color: T.muted }}>pt</span>
                  </div>

                  <div style={{ marginBottom: 7 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: T.label,
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      1. Datasource
                    </div>
                    {dsCatalog.length > 0 ? (
                      <select
                        value={binding.dsRef}
                        style={sel}
                        onChange={(e) =>
                          updateBinding({
                            dsRef: e.target.value,
                            arrayField: "",
                            colMap: [],
                          })
                        }
                      >
                        <option value="">— select —</option>
                        {dsCatalog.map((d) => (
                          <option key={d.ref} value={d.ref}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          fontSize: 9,
                          color: T.muted,
                          fontStyle: "italic",
                        }}
                      >
                        No datasources yet
                      </div>
                    )}
                  </div>

                  {binding.dsRef && (
                    <div style={{ marginBottom: 7 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: T.label,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        2. Child array{" "}
                        <span style={{ fontWeight: 400, color: T.muted }}>
                          — nested array to iterate
                        </span>
                      </div>
                      {arrayFields.length > 0 ? (
                        <select
                          value={binding.arrayField}
                          style={sel}
                          onChange={(e) => {
                            const af = e.target.value;
                            const childR = (firstParentRow?.[af] as any[]) || [];
                            const childC = childR.length > 0 ? Object.keys(childR[0]) : [];
                            const autoMap: string[] = Array.from({ length: numCols }, (_, ci) => {
                              const header = headers[ci] || "";
                              const byName = childC.find(
                                (c) =>
                                  c.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                                  header.toLowerCase().replace(/[^a-z0-9]/g, ""),
                              );
                              return byName || childC[ci] || "";
                            });
                            updateBinding({ arrayField: af, colMap: autoMap });
                          }}
                        >
                          <option value="">— select —</option>
                          {arrayFields.map(({ key, rows: r }) => (
                            <option key={key} value={key}>
                              {key} ({r.length} items)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#dc2626",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: 4,
                            padding: "5px 8px",
                          }}
                        >
                          No array fields found in this datasource row.
                        </div>
                      )}
                      {binding.arrayField && childRows.length > 0 && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 8.5,
                            color: "#16a34a",
                          }}
                        >
                          ✓ {childRows.length} items ·{" "}
                          {childCols.map((c) => `${binding.arrayField}.${c}`).join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {binding.dsRef && binding.arrayField && childCols.length > 0 && numCols > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: T.label,
                            fontWeight: 600,
                          }}
                        >
                          3. Column mapping
                        </div>
                        <span
                          style={{
                            fontSize: 8,
                            borderRadius: 8,
                            padding: "1px 6px",
                            fontWeight: 700,
                            background: colMappedCount === numCols ? "#dcfce7" : "#fef9c3",
                            color: colMappedCount === numCols ? "#16a34a" : "#a16207",
                          }}
                        >
                          {colMappedCount}/{numCols} mapped
                        </span>
                      </div>
                      <div
                        style={{
                          background: T.bg2,
                          border: `1px solid ${T.border}`,
                          borderRadius: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 12px 1fr",
                            gap: 4,
                            padding: "4px 8px",
                            borderBottom: `1px solid ${T.border}`,
                            background: "#f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              color: T.muted,
                            }}
                          >
                            Table column
                          </div>
                          <div />
                          <div
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              color: T.muted,
                            }}
                          >
                            {binding.arrayField}.field
                          </div>
                        </div>
                        {Array.from({ length: numCols }, (_, ci) => (
                          <div
                            key={ci}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 12px 1fr",
                              gap: 4,
                              padding: "4px 8px",
                              borderBottom: `1px solid ${T.border}`,
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9,
                                color: T.text,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 8,
                                  color: T.muted,
                                  marginRight: 4,
                                }}
                              >
                                #{ci + 1}
                              </span>
                              <span style={{ fontFamily: "monospace" }}>
                                {headers[ci] || <em style={{ color: T.muted }}>empty</em>}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: T.muted,
                                textAlign: "center",
                              }}
                            >
                              →
                            </div>
                            <select
                              value={colMapArr[ci] || ""}
                              style={{
                                ...sel,
                                fontSize: 9,
                                padding: "2px 4px",
                                fontFamily: "monospace",
                              }}
                              onChange={(e) => {
                                const next = [...colMapArr];
                                while (next.length <= ci) next.push("");
                                next[ci] = e.target.value;
                                updateBinding({ colMap: next });
                              }}
                            >
                              <option value="">— skip —</option>
                              {childCols.map((c) => (
                                <option key={c} value={c}>
                                  {binding.arrayField}.{c}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      {childRows.length > 0 && colMappedCount > 0 && (
                        <div
                          style={{
                            marginTop: 5,
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 5,
                            padding: "5px 8px",
                            fontSize: 8.5,
                            color: "#166534",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 3 }}>
                            Preview (row 1 of {childRows.length}):
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            {Array.from({ length: numCols }, (_, ci) => {
                              const field = colMapArr[ci];
                              if (!field) return null;
                              const val = childRows[0][field];
                              return (
                                <div
                                  key={ci}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <code
                                    style={{
                                      fontSize: 8.5,
                                      color: "#64748b",
                                      minWidth: 120,
                                    }}
                                  >
                                    {binding.arrayField}.{field}
                                  </code>
                                  <span style={{ color: "#94a3b8" }}>→</span>
                                  <strong style={{ fontFamily: "monospace" }}>
                                    {val !== undefined && val !== null ? String(val) : "—"}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              marginTop: 5,
                              fontSize: 8,
                              color: "#94a3b8",
                              borderTop: "1px solid #bbf7d0",
                              paddingTop: 4,
                            }}
                          >
                            Will render {childRows.length} data row
                            {childRows.length > 1 ? "s" : ""} below the header in PDF
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </PropSection>
        );
      })()}

      {/* ── Repeat ── */}
      <PropSection label="Repeat" color="#7c3aed" icon={<RefreshCw size={9} />} defaultOpen={false}>
        <div style={{ marginBottom: 7 }}>
          <div
            style={{
              fontSize: 9,
              color: T.label,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Repeat mode
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(
              [
                {
                  val: "none",
                  label: "None",
                  desc: "Render once — variables use first row only",
                },
                {
                  val: "inline",
                  label: "Inline",
                  desc: "Repeat for each row, stacked within the page",
                },
                {
                  val: "new-page",
                  label: "New page",
                  desc: "One copy per row, each starting on a new page",
                },
              ] as const
            ).map(({ val, label, desc }) => {
              const active = (comp.repeatMode ?? "none") === val;
              return (
                <label
                  key={val}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: active ? "#ede9fe" : T.bg2,
                    border: `1.5px solid ${active ? "#7c3aed" : T.border}`,
                  }}
                >
                  <input
                    type="radio"
                    name={`repeat-${comp._id}`}
                    value={val}
                    checked={active}
                    onChange={() => up("repeatMode", val)}
                    style={{ marginTop: 1, accentColor: "#7c3aed" }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: active ? "#a855f7" : T.text,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {(comp.repeatMode === "inline" || comp.repeatMode === "new-page") && (
          <>
            <div style={{ marginBottom: 7 }}>
              <div
                style={{
                  fontSize: 9,
                  color: T.label,
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                Datasource{" "}
                <span style={{ fontWeight: 400, color: T.muted }}>— one copy per row</span>
              </div>
              {dsCatalog.length > 0 ? (
                <select
                  value={comp.repeatDataSourceRef ?? ""}
                  style={{
                    ...sel,
                    borderColor: !comp.repeatDataSourceRef ? "#fca5a5" : T.border,
                  }}
                  onChange={(e) => up("repeatDataSourceRef", e.target.value)}
                >
                  <option value="">— select datasource —</option>
                  {dsCatalog.map((d) => (
                    <option key={d.ref} value={d.ref}>
                      {d.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 9, color: T.muted, fontStyle: "italic" }}>
                  No datasources — add one in the Datasets section above
                </div>
              )}
              {!comp.repeatDataSourceRef && (
                <div style={{ fontSize: 8.5, color: "#dc2626", marginTop: 3 }}>
                  ⚠ Select a datasource to enable repeat
                </div>
              )}
            </div>

            {comp.repeatMode === "inline" && (
              <div style={{ marginBottom: 7 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: T.label,
                    fontWeight: 600,
                    marginBottom: 3,
                  }}
                >
                  Gap between copies <span style={{ fontWeight: 400, color: T.muted }}>(pt)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={comp.repeatGap ?? 4}
                  onChange={(e) => up("repeatGap", Number(e.target.value))}
                  style={{ ...inputStyle, width: 70 }}
                />
              </div>
            )}

            {comp.repeatDataSourceRef &&
              (() => {
                const rows = getRows(comp.repeatDataSourceRef);
                return rows.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 5,
                      padding: "5px 9px",
                      fontSize: 9,
                      color: "#166534",
                    }}
                  >
                    <Check size={9} color="#16a34a" />
                    Will render <strong style={{ margin: "0 2px" }}>{rows.length}</strong> copies
                    {comp.repeatMode === "new-page" ? `, one per page` : `, stacked inline`}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 8.5,
                      color: "#92400e",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 4,
                      padding: "5px 9px",
                    }}
                  >
                    Datasource has no rows yet
                  </div>
                );
              })()}
          </>
        )}
      </PropSection>

      <BodyLayoutSection comp={comp} onUpdate={onUpdate} />
    </div>
  );
}
