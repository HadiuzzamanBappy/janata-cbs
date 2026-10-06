import { T } from "../../theme/tokens";
import { inputStyle } from "../../theme/inputStyle";

/**
 * Labelled numeric input cell sized to fit inside a `PropGrid2` slot.
 *
 * The tiny uppercase label sits above the input — distinct from `PropRow`,
 * which puts the label to the left at full text size.
 */
export function PropCell({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
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
        {label}
      </div>
      <input
        style={{ ...inputStyle, textAlign: "center" }}
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(+e.target.value)}
      />
    </div>
  );
}
