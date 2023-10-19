import { plugin } from "ink-mde";
import { TextEditorInterface } from "@/lib/mte-kernel";
import { EditorView, ViewPlugin } from "@codemirror/view";

const viewPlugin = ViewPlugin.define(() => ({
  constructor(view: EditorView) {
    console.log('-->view', view)
  }
}), {
  eventHandlers: {
    mousedown: (event, view) => {
      console.log('mousedown', event, view)
      new TextEditorInterface(view).init();
    },
  },
});

export const betterTable = plugin({
  type: "default",
  value: () => {
    return viewPlugin;
  },
});
