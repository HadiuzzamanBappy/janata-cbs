/**
 * Page-size lookup tables.
 *
 * Two parallel tables because the studio uses two units depending on context:
 *  - `PAGE_SIZE_MM` for canvas geometry / mm-stored body fields.
 *  - `PAGE_SIZE_PT` for the iText/PDF serialiser.
 *
 * Both arrays store dimensions in **portrait** orientation as
 * `[width, height]`. Landscape callers swap the order at use site.
 *
 * Don't recompute one from the other — the rounding the monolith uses
 * (`PAGE_SIZE_PT` is `Math.round`ed) is part of the on-disk format and we
 * want exact byte-equivalence in JSON exports.
 */

export const PAGE_SIZE_MM: Record<string, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  LETTER: [216, 279],
  LEGAL: [216, 356],
};

export const PAGE_SIZE_PT: Record<string, [number, number]> = {
  A4: [595, 842],
  A3: [842, 1191],
  LETTER: [612, 792],
  LEGAL: [612, 1008],
};
