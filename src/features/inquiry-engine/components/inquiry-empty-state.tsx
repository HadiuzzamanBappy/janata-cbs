export interface InquiryEmptyStateProps {
  message?: string;
}

export function InquiryEmptyState({
  message = "No matching records found.",
}: InquiryEmptyStateProps) {
  return (
    <div className="flex-1 min-h-50 flex flex-col items-center justify-center p-6 text-center bg-muted/10">
      <p className="text-xs text-muted-foreground font-mono">{message}</p>
    </div>
  );
}
