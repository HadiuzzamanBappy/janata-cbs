/**
 * @fileoverview Field lookup and immutable updates across the whole layout tree, including the
 * inner fields (`PROP`) of object groups. A field is identified by its `SN` (unique per model,
 * inner fields too, e.g. `5_1`); `NAME` is the fallback for top-level fields only, because an
 * inner field may share a name with a top-level one.
 *
 * @module features/system/form-config/hooks/fc-field-tree
 */

import type { FormElement, FormSection, ModelProperty } from "@/lib/data-schemas";

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

/** The model property for a field: by `SN` at any depth, else a top-level `NAME`. */
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
  return bySn(properties) ?? properties.find((p) => p.NAME === field.NAME) ?? null;
}
