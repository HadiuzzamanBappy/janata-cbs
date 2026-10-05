import type { AppState } from "@/features/reportstudio/types";
import { deepClone } from "@/features/reportstudio/utils/deepClone";
import { INITIAL_STATE } from "./initial-state";

export type UndoState = {
  past: AppState[];
  present: AppState;
  future: AppState[];
};

export type UndoAction =
  | { type: "SET"; fn: (s: AppState) => void }
  | { type: "SET_DIRECT"; state: AppState }
  | { type: "SET_SILENT"; fn: (s: AppState) => void }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

export function undoReducer(s: UndoState, action: UndoAction): UndoState {
  switch (action.type) {
    case "SET": {
      const next = deepClone(s.present);
      action.fn(next);
      return {
        past: [...s.past.slice(-49), s.present],
        present: next,
        future: [],
      };
    }
    case "SET_DIRECT": {
      return {
        past: [...s.past.slice(-49), s.present],
        present: action.state,
        future: [],
      };
    }
    case "SET_SILENT": {
      const next = deepClone(s.present);
      action.fn(next);
      return { past: s.past, present: next, future: s.future }; // no history change
    }
    case "UNDO": {
      if (!s.past.length) return s;
      return {
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future.slice(0, 49)],
      };
    }
    case "REDO": {
      if (!s.future.length) return s;
      return {
        past: [...s.past, s.present],
        present: s.future[0],
        future: s.future.slice(1),
      };
    }
    case "RESET": {
      return { past: [], present: deepClone(INITIAL_STATE), future: [] };
    }
  }
}
