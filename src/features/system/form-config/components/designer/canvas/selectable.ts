import type * as React from "react";

/**
 * Props that make a click-to-select block (e.g. a designer canvas card) keyboard accessible:
 * it is focusable, announced as a pressed/unpressed button, and selects on Enter or Space.
 * Keys pressed inside nested controls (inputs, buttons) are ignored, and selection never bubbles
 * to an enclosing selectable block.
 */
export function selectableProps(onSelect: () => void, selected?: boolean) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-pressed": selected,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect();
    },
  } as const;
}
