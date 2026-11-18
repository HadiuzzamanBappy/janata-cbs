/**
 * @fileoverview Inbound record dates → ISO, by the form's declared field types.
 * @module cbs-form-spec/record-dates
 */

import { toIsoDate, toIsoDateTime } from "@/lib/core-utils";
import { CBS_PROPERTY_TYPE, type FormConfigRecord, type FormElement } from "@/lib/data-schemas";

type RecordValues = Record<string, unknown>;

const isRecord = (v: unknown): v is RecordValues =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

function convertScalar(type: string, value: unknown): unknown {
  const convert = type === CBS_PROPERTY_TYPE.DATE ? toIsoDate : toIsoDateTime;
  return Array.isArray(value) ? value.map(convert) : convert(value);
}

function normalizeFields(fields: readonly FormElement[], values: RecordValues): RecordValues {
  let result: RecordValues | null = null;
  for (const field of fields) {
    const current = values[field.NAME];
    let next = current;
    if (field.TYPE === CBS_PROPERTY_TYPE.DATE || field.TYPE === CBS_PROPERTY_TYPE.DATETIME) {
      next = convertScalar(field.TYPE, current);
    } else if (field.PROP?.length && Array.isArray(current)) {
      const sub = field.PROP;
      next = current.map((row) => (isRecord(row) ? normalizeFields(sub, row) : row));
    } else if (field.PROP?.length && isRecord(current)) {
      next = normalizeFields(field.PROP, current);
    }
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      result ??= { ...values };
      result[field.NAME] = next;
    }
  }
  return result ?? values;
}

/**
 * Converts a loaded record's Date and DateTime fields (nested rows included) to ISO, so the
 * screen, its validation and what it saves only ever see ISO. Run once, when the record loads.
 */
export function normalizeRecordDates(spec: FormConfigRecord, record: RecordValues): RecordValues {
  return normalizeFields(
    spec.frmElements.sections.flatMap((s) => s.fields),
    record,
  );
}
