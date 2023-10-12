import { EditorView } from "@codemirror/view";
import { plugin } from "ink-mde";

const theme = EditorView.theme({}, { dark: false });

export const willowLightTheme = plugin({
  type: "default",
  value: () => {
    return theme;
  },
});
