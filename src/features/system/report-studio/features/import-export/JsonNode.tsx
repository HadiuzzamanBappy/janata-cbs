import { Fragment, type ReactNode, useState } from "react";

/**
 * Collapsible JSON tree node used by the export modal's tree view.
 *
 * Self-recurses through objects and arrays; expands the first two depths by
 * default and lazy-expands the rest on click. Highlights search matches in
 * keys and string/number values.
 */
export function JsonNode({
  propKey = null,
  v,
  depth,
  defaultCollapsed,
  searchLow,
}: {
  propKey?: string | null;
  v: any;
  depth: number;
  defaultCollapsed: boolean;
  searchLow: string;
}) {
  const isObj = v !== null && typeof v === "object" && !Array.isArray(v);
  const isArr = Array.isArray(v);
  const hasChildren = isObj || isArr;
  const [open, setOpen] = useState(!defaultCollapsed);

  const indent = depth * 16;
  const count = hasChildren ? Object.keys(v).length : 0;

  const hl = (s: string): ReactNode => {
    if (!searchLow || !s.toLowerCase().includes(searchLow)) return s;
    const idx = s.toLowerCase().indexOf(searchLow);
    return (
      <>
        {s.slice(0, idx)}
        <mark
          style={{
            background: "#fef08a",
            color: "#1e293b",
            borderRadius: 2,
            padding: "0 1px",
          }}
        >
          {s.slice(idx, idx + searchLow.length)}
        </mark>
        {s.slice(idx + searchLow.length)}
      </>
    );
  };

  const primitiveNode = (val: any) => {
    if (val === null) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>null</span>;
    if (typeof val === "boolean")
      return <span style={{ color: "#d97706", fontWeight: 600 }}>{String(val)}</span>;
    if (typeof val === "number") return <span style={{ color: "#0891b2" }}>{hl(String(val))}</span>;
    if (typeof val === "string") return <span style={{ color: "#059669" }}>{hl(val)}</span>;
    return <span>{String(val)}</span>;
  };

  const keyNode =
    propKey !== null ? (
      <span style={{ color: "#1e40af", fontWeight: 700 }}>
        {hl(propKey ?? "")}
        <span style={{ color: "#94a3b8", fontWeight: 400 }}>: </span>
      </span>
    ) : null;

  if (!hasChildren) {
    return (
      <div
        style={{
          paddingLeft: indent,
          lineHeight: "1.75",
          whiteSpace: "nowrap",
        }}
      >
        {keyNode}
        {primitiveNode(v)}
      </div>
    );
  }

  const bracket = isArr ? ["[", "]"] : ["{", "}"];
  const summary = isArr ? (
    <span style={{ color: "#94a3b8", fontSize: 10 }}>
      {" "}
      [{count} item{count !== 1 ? "s" : ""}]
    </span>
  ) : (
    <span style={{ color: "#94a3b8", fontSize: 10 }}>
      {" "}
      {"{"}…{"}"} {count} key{count !== 1 ? "s" : ""}
    </span>
  );

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : indent }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          lineHeight: "1.75",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          style={{
            color: "#7c3aed",
            marginRight: 4,
            fontSize: 9,
            width: 10,
            display: "inline-block",
            textAlign: "center",
          }}
        >
          {open ? "▾" : "▸"}
        </span>
        {keyNode}
        <span style={{ color: "#64748b" }}>{bracket[0]}</span>
        {!open && summary}
        {!open && <span style={{ color: "#64748b" }}>{bracket[1]}</span>}
      </div>
      {open && (
        <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 5 }}>
          {Object.entries(v as Record<string, any>).map(([ck, cv]) => (
            <Fragment key={ck}>
              <JsonNode
                propKey={isArr ? undefined : ck}
                v={cv}
                depth={depth + 1}
                defaultCollapsed={depth >= 2}
                searchLow={searchLow}
              />
            </Fragment>
          ))}
        </div>
      )}
      {open && (
        <div
          style={{
            paddingLeft: indent + 16,
            color: "#64748b",
            lineHeight: "1.75",
          }}
        >
          {bracket[1]}
        </div>
      )}
    </div>
  );
}
