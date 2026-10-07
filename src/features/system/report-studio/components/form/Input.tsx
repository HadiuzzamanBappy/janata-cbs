import { inputStyle } from "../../theme/inputStyle";

/**
 * Studio's stock text/number input. Coerces to `number` when `type === "number"`
 * so callers receive raw numeric values instead of strings.
 *
 * Replaces the monolith's inline `PropInput` definition — same interface,
 * just lifted to a module-level component file.
 */
export function Input({
  value,
  onChange,
  type = "text",
  step,
  min,
  max,
  placeholder,
}: {
  value: any;
  onChange: (v: any) => void;
  type?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      style={inputStyle}
      type={type}
      value={value ?? ""}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(type === "number" ? +e.target.value : e.target.value)}
    />
  );
}
