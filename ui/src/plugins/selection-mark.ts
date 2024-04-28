import {
  StateField,
  type Extension,
  EditorState,
  SelectionRange,
  Range,
  RangeSet,
} from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { plugin } from "ink-mde";

const selectionMarkExtension = (): Extension => {
  const selectionMarkField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(_decoration, { state }) {
      return decorate(state);
    },
    provide: (f) => EditorView.decorations.from(f),
  });

  const selectionMark = Decoration.mark({
    class: "willow-selection-mark",
  });

  const selectionMarkTheme = EditorView.theme({
    ".willow-selection-mark": {
      background: "#bfd6fb",
      padding: "0.375em 0",
    },
    ".willow-selection-mark::selection": {
      background: "none",
    },
    ".willow-selection-mark *::selection": {
      background: "none",
    },
  });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];
    const effects: SelectionRange[] = state.selection.ranges.filter(
      (r) => !r.empty
    );

    if (effects.length) {
      effects.forEach((effect) => {
        widgets.push(selectionMark.range(effect.from, effect.to));
      });
    }

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
  };

  return [selectionMarkField, selectionMarkTheme];
};

export const selectionMark = plugin({
  value: () => {
    return selectionMarkExtension();
  },
});
