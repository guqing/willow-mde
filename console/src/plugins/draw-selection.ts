import { drawSelection } from "@codemirror/view";
import { plugin } from "ink-mde";

export const drawBetterSelection = plugin({
  type: "default",
  value: () => {
    return drawSelection({
      drawRangeCursor: true,
    });
  },
});
