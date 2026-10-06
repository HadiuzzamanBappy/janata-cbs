export function SearchFooterHelp() {
  return (
    <div className="px-3.5 py-2 -mx-1 -mb-1 flex items-center justify-between border-t border-border/50 text-[11px] text-muted-foreground bg-muted/30 rounded-b-xl select-none">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">↑</kbd>
          <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">↓</kbd>
          <span>Navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">↵</kbd>
          <span>Select</span>
        </span>
      </div>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">ESC</kbd>
        <span>Close</span>
      </span>
    </div>
  );
}
