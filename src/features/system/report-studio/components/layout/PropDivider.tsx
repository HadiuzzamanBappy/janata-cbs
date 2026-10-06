import { T } from "../../theme/tokens";

/** Thin horizontal rule used to separate logically distinct field groups. */
export function PropDivider() {
  return <div style={{ borderTop: `1px solid ${T.border}`, margin: "10px 0 8px" }} />;
}
