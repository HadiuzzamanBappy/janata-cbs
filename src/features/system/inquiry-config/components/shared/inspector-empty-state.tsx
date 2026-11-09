export interface InspectorEmptyStateProps {
  message: string;
}

export function InspectorEmptyState({ message }: InspectorEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
      <p className="text-xs font-mono">{message}</p>
    </div>
  );
}
