/**
 * @fileoverview Field lookup and immutable updates across the whole layout tree, including the
 * inner fields (`PROP`) of object groups. A field is identified by its `SN` (unique per model,
 * inner fields too, e.g. `5_1`); `NAME` is the fallback for top-level fields only, because an
 * inner field may share a name with a top-level one.
 *
 * @module features/system/form-config/hooks/fc-field-tree
 */

import { modelPropertyMatcher } from "@/lib/cbs-form-spec";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  DEFAULT_PROPERTY_LENGTH,
  type FormElement,
  type FormSection,
  type ModelProperty,
} from "@/lib/data-schemas";

/** Every section and tab-group id on the form, so a generated id never repeats one. */
export const takenContainerIds = (sections: FormSection[]): Set<string> =>
  new Set(sections.flatMap((s) => (s.groupId ? [s.id, s.groupId] : [s.id])));

export interface FieldLocation {
  field: FormElement;
  section: FormSection;
  /** The object group holding the field; undefined for a top-level field. */
  parent?: FormElement;
  /** Index path inside the section: [top-level index, inner index, ...]. */
  path: number[];
}

function findBySn(fields: FormElement[], sn: string, path: number[]): number[] | null {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].SN === sn) return [...path, i];
    const inner = fields[i].PROP;
    if (inner?.length) {
      const found = findBySn(inner, sn, [...path, i]);
      if (found) return found;
    }
  }
  return null;
}

function locate(sections: FormSection[], id: string): { s: number; path: number[] } | null {
  for (let s = 0; s < sections.length; s++) {
    const path = findBySn(sections[s].fields ?? [], id, []);
    if (path) return { s, path };
  }
  for (let s = 0; s < sections.length; s++) {
    const idx = (sections[s].fields ?? []).findIndex((f) => f.NAME === id);
    if (idx !== -1) return { s, path: [idx] };
  }
  return null;
}

/** Finds a field anywhere in the layout, inner fields included. */
export function findFieldDeep(sections: FormSection[], id: string | null): FieldLocation | null {
  if (!id) return null;
  const hit = locate(sections, id);
  if (!hit) return null;
  const section = sections[hit.s];
  let parent: FormElement | undefined;
  let field = section.fields[hit.path[0]];
  for (const idx of hit.path.slice(1)) {
    parent = field;
    field = (field.PROP ?? [])[idx];
  }
  return { field, section, parent, path: hit.path };
}

function updateAt(
  fields: FormElement[],
  path: number[],
  fn: (f: FormElement) => FormElement | null,
): FormElement[] {
  const [idx, ...rest] = path;
  if (rest.length === 0) {
    const next = fn(fields[idx]);
    return next ? fields.map((f, i) => (i === idx ? next : f)) : fields.filter((_, i) => i !== idx);
  }
  return fields.map((f, i) => (i === idx ? { ...f, PROP: updateAt(f.PROP ?? [], rest, fn) } : f));
}

/**
 * Returns new sections with the identified field replaced by `fn(field)`, or removed when `fn`
 * returns null. The sections are returned unchanged when the field isn't found.
 */
export function updateFieldDeep(
  sections: FormSection[],
  id: string,
  fn: (field: FormElement) => FormElement | null,
): FormSection[] {
  const hit = locate(sections, id);
  if (!hit) return sections;
  return sections.map((sec, s) =>
    s === hit.s ? { ...sec, fields: updateAt(sec.fields ?? [], hit.path, fn) } : sec,
  );
}

/**
 * The model property for a field in the designer: by `SN` at any depth (inner `SN`s are unique,
 * inner names are not), else a top-level `NAME` matched the way the compiler matches it.
 */
export function findModelPropDeep(
  properties: ModelProperty[],
  field: Pick<FormElement, "SN" | "NAME">,
): ModelProperty | null {
  const bySn = (list: ModelProperty[]): ModelProperty | null => {
    for (const p of list) {
      if (p.SN === field.SN) return p;
      const inner = p.PROP?.length ? bySn(p.PROP) : null;
      if (inner) return inner;
    }
    return null;
  };
  return bySn(properties) ?? modelPropertyMatcher(properties)(field.NAME) ?? null;
}

/**
 * The one way a new field joins the layout (palette click or drop, onto the canvas or into a
 * section). It keeps the template and fills only identity and column basics: no default values,
 * so the inspector shows the engine's defaults and nothing extra is stored. The template's `SN`
 * is kept unless another field on the form has it; otherwise, and for a blank field, the first
 * free number is used.
 */
export function createDesignerField(
  template: Partial<FormElement>,
  sections: FormSection[],
): FormElement {
  const usedSns = new Set(sections.flatMap((s) => (s.fields ?? []).map((f) => String(f.SN))));
  let next = usedSns.size + 1;
  while (usedSns.has(String(next))) next++;
  const sn = template.SN && !usedSns.has(String(template.SN)) ? String(template.SN) : String(next);
  return {
    ...template,
    SN: sn,
    NAME: template.NAME || `field_${next}`,
    LABEL: template.LABEL || `Field ${next}`,
    TYPE: template.TYPE || CBS_PROPERTY_TYPE.STRING,
    LENGTH: template.LENGTH ?? DEFAULT_PROPERTY_LENGTH,
    STRUCTURE: template.STRUCTURE || CBS_PROPERTY_STRUCTURE.SINGLE,
    REQUIRED: Boolean(template.REQUIRED),
    MODELNAME: template.MODELNAME ?? "",
  };
}

/**
 * A tab group needs two tabs: when only one tab of `groupId` is left, it becomes a plain card.
 * Run after a tab leaves its group (removed, or converted or moved away).
 */
export function dissolveLoneTabGroup(sections: FormSection[], groupId?: string): FormSection[] {
  if (!groupId) return sections;
  const peers = sections.filter((s) => s.containerType === "tab" && s.groupId === groupId);
  if (peers.length !== 1) return sections;
  return sections.map((s) =>
    s.id === peers[0].id
      ? { ...s, containerType: "card", groupId: undefined, groupTitle: undefined }
      : s,
  );
}
