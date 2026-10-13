## 1. Dynamic Form Engine: Form Library Integration
**Current State:** 
The dynamic schema engine relies on a custom `use-form-state.ts` + `use-form-persistence.ts` two-tier state model to track user input across dynamically generated GMC fields.

**The Future Upgrade (Phase 2):**
Maintaining a custom form state engine works well for single cards, but complex nested dynamic sub-tables benefit from `react-hook-form`.
- **Dependency to evaluate:** `react-hook-form` paired with `@hookform/resolvers/zod`.
- **Why:** `react-hook-form` supports dynamic `useFieldArray` and isolated field re-renders. By feeding backend `GMC` schemas into dynamic `react-hook-form` controllers, you gain built-in dirty/touched states and optimized typing performance on very large banking forms with repeated sub-tables.
