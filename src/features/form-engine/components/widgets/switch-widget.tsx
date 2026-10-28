import type { BaseWidgetProps } from "../../types";

export interface SwitchWidgetProps extends BaseWidgetProps {}

export function SwitchWidget({
  id,
  value,
  onChange,
  disabled = false,
  className,
}: SwitchWidgetProps) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className || ""}`}>
      <input
        type="checkbox"
        id={id}
        disabled={disabled}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-60 peer-disabled:cursor-default" />
    </label>
  );
}
