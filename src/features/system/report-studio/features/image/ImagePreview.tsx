import { FileImage } from "lucide-react";
import type { BodyComponent } from "../../types/body";

/**
 * Canvas-side preview of an IMAGE body component.
 *
 * Detects whether `comp.imagePath` is a real renderable source (data URL or
 * http/https) — if not, draws a placeholder box with the path string. The
 * placeholder/visual distinction matters because designers often paste a
 * filename like "logo.png" before uploading and we want the canvas to look
 * sensible during that interim.
 *
 * Rotation is applied to the inner box via CSS `transform: rotate()`. The
 * surrounding wrapper stays at the original `W × H` so the caption (when
 * present) renders below the unrotated bounding box. The PDF renderer does
 * the same.
 */
export function ImagePreview({
  comp,
  scale,
  selected: _selected,
  onClick: _onClick,
}: {
  comp: BodyComponent;
  scale: number;
  selected: boolean;
  onClick: () => void;
}) {
  const toPx = (v: number) => Math.round(v * scale);
  const W = toPx(comp.imageWidth || 80);
  const H = toPx(comp.imageHeight || 60);
  const rot = comp.imageRotation || 0;
  const brd = comp.imageBorder || {};
  const r = comp.imageRadius;
  const radius = r
    ? `${r.topLeft || 0}px ${r.topRight || 0}px ${r.bottomRight || 0}px ${r.bottomLeft || 0}px`
    : "4px";

  const path = (comp.imagePath || "").trim();
  const hasImage =
    path.startsWith("data:image/") || path.startsWith("http://") || path.startsWith("https://");

  return (
    <div style={{ position: "relative", pointerEvents: "none", width: W, height: H }}>
      <div
        style={{
          width: W,
          height: H,
          transform: `rotate(${rot}deg)`,
          transformOrigin: "center",
          background: hasImage ? "#fff" : "#f1f5f9",
          border: brd.enabled
            ? `${brd.width || 1}px ${brd.style || "solid"} ${brd.color || "#cbd5e1"}`
            : "1.5px dashed #cbd5e1",
          borderRadius: radius,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: toPx(4),
          overflow: "hidden",
          position: "relative",
          opacity: comp.imageOpacity ?? 1,
        }}
      >
        {hasImage ? (
          <img
            src={path}
            alt="preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <>
            <FileImage size={Math.max(14, toPx(12))} color="#94a3b8" />
            <span
              style={{
                fontSize: Math.max(7, toPx(6)),
                color: "#94a3b8",
                textAlign: "center",
                padding: `0 ${toPx(4)}px`,
                wordBreak: "break-all",
                maxWidth: "90%",
              }}
            >
              {comp.imagePath || "image.png"}
            </span>
          </>
        )}
      </div>
      {comp.imageCaption && (
        <div
          style={{
            textAlign: (comp.imageCaptionAlign || "center") as any,
            fontSize: Math.max(7, toPx((comp.imageCaptionSize || 8) * 0.76)),
            color: comp.imageCaptionColor || "#64748b",
            marginTop: toPx(3),
            fontStyle: "italic",
            padding: `0 ${toPx(4)}px`,
          }}
        >
          {comp.imageCaption}
        </div>
      )}
    </div>
  );
}
