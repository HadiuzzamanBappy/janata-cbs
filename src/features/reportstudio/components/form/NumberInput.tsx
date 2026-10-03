import { inputStyle } from "../../theme/inputStyle";

/**
 * Number-only input — convenience wrapper over `<input type="number">` that
 * always emits numbers. Lives in its own file because several feature panels
 * special-case number handling (e.g. NaN guards) and may need to swap this
 * for a richer numeric widget later without touching the generic `Input`.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  align = "left",
}: {
  value: number | string | undefined | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <input
      style={{ ...inputStyle, textAlign: align }}
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={e => {
        const n = +e.target.value;
        // Leave NaN out — feature panels treat undefined as "unset"
        if (Number.isFinite(n)) onChange(n);
      }}
    />
  );
}
