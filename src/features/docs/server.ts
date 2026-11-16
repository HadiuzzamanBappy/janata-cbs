// Docs Feature Module: Server-Only Public API
// Kept separate from `index.ts` because these modules read the filesystem and must never reach
// a client bundle. Import from Server Components / route segments only.

import "server-only";

export { DocViewer } from "./components/doc-viewer";
