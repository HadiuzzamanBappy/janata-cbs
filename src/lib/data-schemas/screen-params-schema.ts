import { z } from "zod";
import { CBS_INQUIRY_STEP, CBS_SCREEN_COMPONENTS, CBS_SCREEN_MODES } from "@/types";
import { filterCriteriaMapSchema } from "./inquiry-config-schema";

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
});

/**
 * Tab a detached popup hands back to the main shell (`CBS_SCREEN_MESSAGE.DOCK_TAB`), a trust
 * boundary: it arrives over BroadcastChannel / postMessage and is rejected whole if malformed.
 * `componentName` is a generic host or a bespoke command key, so any non-empty string.
 */
export const dockTabPayloadSchema = z.object({
  screenId: z.string().min(1),
  title: z.string().min(1),
  componentName: z.string().min(1),
  screenMode: z.enum(CBS_SCREEN_MODES).optional(),
  searchRecordId: z.string().optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
  baseline: z.record(z.string(), z.unknown()).optional(),
  isDirty: z.boolean().optional(),
  inquiryState: z
    .object({
      step: z.enum(CBS_INQUIRY_STEP).optional(),
      criteria: filterCriteriaMapSchema.optional(),
      currentPage: z.number().int().positive().optional(),
    })
    .optional(),
});

/** Dynamic route segment of `/screen/[id]`: the URL-encoded screen command. */
export const popupRouteParamsSchema = z.object({ id: z.string().min(1) });
