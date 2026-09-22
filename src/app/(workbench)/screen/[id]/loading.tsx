import { ScreenLoader } from "@/components/feedback/screen-loader";

export default function ScreenLoadingState() {
  return (
    <div className="h-full w-full p-4 bg-muted/15">
      <ScreenLoader />
    </div>
  );
}
