import { z } from "zod";
import { CBS_INQUIRY_STEP, CBS_SCREEN_COMPONENTS, CBS_SCREEN_MODES } from "@/types";

/** An optional URL value: anything invalid (tampered or stale) becomes `undefined`, alone. */
const urlValue = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

/**
 * Detached popup URL (`/screen/[id]?…`), a trust boundary: the opener writes these values, but a
 * user can edit them. Each field is validated on its own so one bad value falls back to its
 * default without discarding the rest.
 */
export const popupSearchParamsSchema = z.object({
  tabId: urlValue(z.string().min(1)),
  mode: urlValue(z.enum(CBS_SCREEN_MODES)),
  recordId: urlValue(z.string()),
  title: urlValue(z.string().min(1)),
  component: urlValue(z.enum(CBS_SCREEN_COMPONENTS)),
  step: urlValue(z.enum(CBS_INQUIRY_STEP)),
  page: urlValue(z.coerce.number().int().positive()),
  pageSize: urlValue(z.coerce.number().int().positive()),
});

/** Dynamic route segment of `/screen/[id]`: the URL-encoded screen command. */
export const popupRouteParamsSchema = z.object({ id: z.string().min(1) });
