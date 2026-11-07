[] 1. ZERO REACT / ZERO DOM BOUNDARY

- Does the file import React, hooks (useState, useEffect), or DOM globals (window, document)?
- Rule: src/lib must be 100% headless. If it touches UI or DOM, move it to src/features or src/components.

[] 2. UNIDIRECTIONAL LAYER HIERARCHY

- Does it import from @/features, @/components, @/store, or @/app?
- Rule: NEVER import higher layers. Upward notifications must use adapters or callbacks.

[] 3. PURE FUNCTIONAL DETERMINISM

- Given the same input, does it always return the same output without hidden state mutations?
- Rule: No module-level mutable variables. No Date.now() or Math.random() for ID generation (use generateClientToken).

[] 4. ZERO MAGIC STRINGS & ZERO HARDCODED PIXELS

- Are sizes, widths, modes, or action codes using canonical enums and design tokens?
- Rule: No "280px", no "col-span-3" hardcoded in data compilers. Use semantic tokens ("xs".."full").

[] 5. SINGLE RESPONSIBILITY & SIZE BUDGET

- Is the file ≤ 250 lines?
- Does it have one focused job (e.g., path traversal, validation, or compilation)?

[] 6. STRICT BOUNDARY VALIDATION

- Does it handle null/undefined gracefully without throwing unhandled exceptions?
- Rule: Safe navigation, defensive defaults, zero unhandled JSON parsing.

[] 7. HEADLESS TESTABILITY

- Can this file be tested in Node without a browser or React test renderer?
- Rule: Every lib function must be verifiable with a simple tsx script in < 50ms.
