import type { WidgetType } from "@codemirror/view";

export type WidgetSpec = WidgetType & { id?: string };

export type WidgetOptions<T extends Record<string, any>> = {
  [K in keyof T | "compare" | "eq"]?: K extends "compare" | "eq"
    ? (other: WidgetReturn<T>) => boolean
    : K extends keyof WidgetSpec
    ? WidgetSpec[K]
    : T[K];
};

export type WidgetReturn<T extends Record<string, any>> = {
  [K in keyof (T & WidgetSpec)]: K extends keyof T
    ? NonNullable<T[K]>
    : K extends keyof WidgetSpec
    ? WidgetSpec[K]
    : never;
};

export const buildWidget = <T extends Record<string, any>>(
  options: WidgetOptions<T>
): WidgetSpec => {
  const eq = (other: WidgetReturn<T>) => {
    if (options.eq) return options.eq(other);
    if (!options.id) return false;

    return options.id === other.id;
  };

  return {
    compare: (other: WidgetReturn<T>) => {
      return eq(other);
    },
    coordsAt: () => null,
    destroy: () => {},
    eq: (other: WidgetReturn<T>) => {
      return eq(other);
    },
    estimatedHeight: -1,
    ignoreEvent: () => true,
    lineBreaks: 0,
    toDOM: () => {
      return document.createElement("span");
    },
    updateDOM: () => false,
    ...options,
  };
};
