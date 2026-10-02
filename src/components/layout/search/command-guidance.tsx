import type { CommandGuideInfo, RidashOption } from "./types";

interface CommandGuidanceProps {
  guideInfo: CommandGuideInfo;
  options: RidashOption[];
  permittedRights: string[];
  hasRight: (code: any) => boolean;
  onSelectOption: (optionCode: string) => void;
}

export function CommandGuidance({
  guideInfo,
  options,
  permittedRights,
  hasRight,
  onSelectOption,
}: CommandGuidanceProps) {
  return (
    <div className="px-3 py-1.5 border-b border-border/50 bg-muted/30 flex flex-col gap-1 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="font-mono font-medium text-foreground text-[10px]">
          {guideInfo.appName} &lt;FUNCTION&gt; [ID]
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          Permitted: {permittedRights.join("")}
        </span>
      </div>

      {options.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap">
          {options.map((opt) => {
            const isSelected = guideInfo.typedFn === opt.code;

            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => onSelectOption(opt.code)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                    : "bg-background/80 hover:bg-accent border-border/60 text-foreground"
                }`}
                title={`Select function ${opt.code} (${opt.label})`}
              >
                <span className="font-bold">{opt.code}</span>
                <span className="text-[9px] opacity-80">{opt.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground italic">
          No function rights available on this application for your profile.
        </span>
      )}

      {guideInfo.typedFn && !hasRight(guideInfo.typedFn) && (
        <div className="text-[10px] text-destructive font-medium mt-0.5 flex items-center gap-1">
          <span>⚠ Access Denied:</span>
          <span>You do not have '{guideInfo.typedFn}' function permission.</span>
        </div>
      )}
    </div>
  );
}
