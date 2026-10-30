/**
 * Lightweight, robust Myers diff algorithm for text lines.
 * Computes shortest edit script to produce GitHub-style line-by-line diffs.
 */

export type LineDiffType = "equal" | "insert" | "delete";

export interface LineDiffItem {
  id: string;
  type: LineDiffType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  items: LineDiffItem[];
}

export function computeLineDiff(oldText: string, newText: string): DiffSummary {
  const oldLines = oldText ? oldText.split("\n") : [];
  const newLines = newText ? newText.split("\n") : [];

  const n = oldLines.length;
  const m = newLines.length;

  if (n === 0 && m === 0) {
    return { additions: 0, deletions: 0, items: [] };
  }

  // Fast path: if equal
  if (oldText === newText) {
    return {
      additions: 0,
      deletions: 0,
      items: oldLines.map((text, i) => ({
        id: `eq-${i + 1}`,
        type: "equal",
        text,
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      })),
    };
  }

  // Standard Myers forward search
  const max = n + m;
  const v: number[] = new Array(2 * max + 1).fill(0);
  const trace: number[][] = [];

  let x = 0;
  let y = 0;

  outer: for (let d = 0; d <= max; d++) {
    trace.push([...v]);

    for (let k = -d; k <= d; k += 2) {
      const idx = k + max;
      if (k === -d || (k !== d && v[idx - 1] < v[idx + 1])) {
        x = v[idx + 1];
      } else {
        x = v[idx - 1] + 1;
      }
      y = x - k;

      while (x < n && y < m && oldLines[x] === newLines[y]) {
        x++;
        y++;
      }

      v[idx] = x;

      if (x >= n && y >= m) {
        break outer;
      }
    }
  }

  // Backtrack to recover edit sequence
  const rawChanges: { type: LineDiffType; text: string }[] = [];
  x = n;
  y = m;

  for (let d = trace.length - 1; d > 0; d--) {
    const vPrev = trace[d];
    const k = x - y;
    const idx = k + max;

    const cameFromInsert = k === -d || (k !== d && vPrev[idx - 1] < vPrev[idx + 1]);
    const prevK = cameFromInsert ? k + 1 : k - 1;
    const prevIdx = prevK + max;

    const prevX = vPrev[prevIdx];
    const prevY = prevX - prevK;

    while (x > (cameFromInsert ? prevX : prevX + 1) && y > prevY) {
      rawChanges.push({ type: "equal", text: oldLines[x - 1] });
      x--;
      y--;
    }

    if (cameFromInsert) {
      rawChanges.push({ type: "insert", text: newLines[y - 1] });
      y--;
    } else {
      rawChanges.push({ type: "delete", text: oldLines[x - 1] });
      x--;
    }
  }

  while (x > 0 && y > 0) {
    rawChanges.push({ type: "equal", text: oldLines[x - 1] });
    x--;
    y--;
  }

  rawChanges.reverse();

  let additions = 0;
  let deletions = 0;
  let curOldLine = 1;
  let curNewLine = 1;

  const items: LineDiffItem[] = rawChanges.map((change) => {
    if (change.type === "insert") {
      additions++;
      const item: LineDiffItem = {
        id: `ins-${curNewLine}`,
        type: "insert",
        text: change.text,
        newLineNumber: curNewLine,
      };
      curNewLine++;
      return item;
    }
    if (change.type === "delete") {
      deletions++;
      const item: LineDiffItem = {
        id: `del-${curOldLine}`,
        type: "delete",
        text: change.text,
        oldLineNumber: curOldLine,
      };
      curOldLine++;
      return item;
    }

    const item: LineDiffItem = {
      id: `eq-${curOldLine}-${curNewLine}`,
      type: "equal",
      text: change.text,
      oldLineNumber: curOldLine,
      newLineNumber: curNewLine,
    };
    curOldLine++;
    curNewLine++;
    return item;
  });

  return { additions, deletions, items };
}
