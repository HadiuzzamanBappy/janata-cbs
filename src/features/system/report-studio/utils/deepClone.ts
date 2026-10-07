/**
 * Structural deep-clone used everywhere the reducer needs to produce a new
 * `present` value without mutating the previous one.
 *
 * Implementation note — preserved verbatim from the monolith:
 *  - We deliberately use `JSON.parse(JSON.stringify(...))` rather than
 *    `structuredClone`. The studio state contains only JSON-safe data
 *    (numbers, strings, plain objects, arrays) plus an occasional `null`,
 *    and the JSON round-trip strips `undefined` fields which keeps state
 *    diffs small in the undo/redo history and JSON exports.
 *  - It is also safe to call on objects that include base64 `data:` strings
 *    (logos, images) because those are plain string fields.
 */
export const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o));
