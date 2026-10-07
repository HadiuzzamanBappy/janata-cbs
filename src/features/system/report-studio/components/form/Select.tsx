import { inputStyle } from "../../theme/inputStyle";

/**
 * Studio's stock select. Accepts either an array of strings (label === value)
 * or `{ v, l }` records.
 *
 * Replaces the monolith's `PropSelect` — same option-shape contract.
 */
export type SelectOption = string | { v: string; l: string };

export function Select({
  value,
  onChange,
  options,
}: {
  value: any;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  return (
    <select
      style={{ ...inputStyle, cursor: "pointer" }}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => {
        const v = (o as any).v ?? o;
        const l = (o as any).l ?? o;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}
