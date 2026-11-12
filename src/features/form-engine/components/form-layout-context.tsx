"use client";

import * as React from "react";

export interface FormLayoutContextValue {
  layout: "horizontal" | "stacked";
}

export const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  layout: "horizontal",
});

export function useFormLayout(): FormLayoutContextValue {
  return React.useContext(FormLayoutContext);
}
