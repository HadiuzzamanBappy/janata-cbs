# 04: Domain-Driven Design Limits

- **Strict UI Separation**: Dumb, generic UI primitives MUST go in `src/components/ui/`. Smart, business-logic components MUST go in `src/features/<domain-name>/`.
- **Feature Colocation**: Everything related to a specific domain (components, hooks, server actions, schemas) MUST be colocated inside its respective `src/features/<domain-name>/` directory, not flat global folders.
- **Component File Limits**: React component files MUST NOT exceed 300 lines of code. If a file hits this limit, extract smaller atomic sub-components immediately.
- **Utility File Limits**: Pure utility functions or logic files MUST NOT exceed 200 lines of code.
