import { plugin } from "ink-mde";
import { createTableEditor } from "@/lib/mte-kernel";
import { options, TableEditor, Alignment } from "@susisu/mte-kernel";
import { EditorView, ViewPlugin } from "@codemirror/view";

// options for the table editor
const opts = options({
  smartCursor: true,
  cursorIsInTable: true,
});

const keyMapOf = (event: KeyboardEvent, tableEditor: TableEditor): Map<string, KeyOperation> => {
  const obj = {
    Tab: (): void => {
      event.preventDefault();
      tableEditor.nextCell(opts);
    },
    "Shift-Tab": () => {
      tableEditor.previousCell(opts);
    },
    Enter: () => {
      event.preventDefault();
      tableEditor.nextRow(opts);
    },
    "Ctrl-Enter": () => {
      tableEditor.escape(opts);
    },
    "Cmd-Enter": () => {
      tableEditor.escape(opts);
    },
    "Shift-Ctrl-Left": () => {
      tableEditor.alignColumn(Alignment.LEFT, opts);
    },
    "Shift-Cmd-Left": () => {
      tableEditor.alignColumn(Alignment.LEFT, opts);
    },
    "Shift-Ctrl-Right": () => {
      tableEditor.alignColumn(Alignment.RIGHT, opts);
    },
    "Shift-Cmd-Right": () => {
      tableEditor.alignColumn(Alignment.RIGHT, opts);
    },
    "Shift-Ctrl-Up": () => {
      tableEditor.alignColumn(Alignment.CENTER, opts);
    },
    "Shift-Cmd-Up": () => {
      tableEditor.alignColumn(Alignment.CENTER, opts);
    },
    "Shift-Ctrl-Down": () => {
      tableEditor.alignColumn(Alignment.NONE, opts);
    },
    "Shift-Cmd-Down": () => {
      tableEditor.alignColumn(Alignment.NONE, opts);
    },
    "Ctrl-Left": () => {
      tableEditor.moveFocus(0, -1, opts);
    },
    "Cmd-Left": () => {
      tableEditor.moveFocus(0, -1, opts);
    },
    "Ctrl-Right": () => {
      tableEditor.moveFocus(0, 1, opts);
    },
    "Cmd-Right": () => {
      tableEditor.moveFocus(0, 1, opts);
    },
    "Ctrl-Up": () => {
      tableEditor.moveFocus(-1, 0, opts);
    },
    "Cmd-Up": () => {
      tableEditor.moveFocus(-1, 0, opts);
    },
    "Ctrl-Down": () => {
      tableEditor.moveFocus(1, 0, opts);
    },
    "Cmd-Down": () => {
      tableEditor.moveFocus(1, 0, opts);
    },
    "Ctrl-K Ctrl-I": () => {
      tableEditor.insertRow(opts);
    },
    "Cmd-K Cmd-I": () => {
      tableEditor.insertRow(opts);
    },
    "Ctrl-L Ctrl-I": () => {
      tableEditor.deleteRow(opts);
    },
    "Cmd-L Cmd-I": () => {
      tableEditor.deleteRow(opts);
    },
    "Ctrl-K Ctrl-J": () => {
      tableEditor.insertColumn(opts);
    },
    "Cmd-K Cmd-J": () => {
      tableEditor.insertColumn(opts);
    },
    "Ctrl-L Ctrl-J": () => {
      tableEditor.deleteColumn(opts);
    },
    "Cmd-L Cmd-J": () => {
      tableEditor.deleteColumn(opts);
    },
    "Alt-Shift-Ctrl-Left": () => {
      tableEditor.moveColumn(-1, opts);
    },
    "Alt-Shift-Cmd-Left": () => {
      tableEditor.moveColumn(-1, opts);
    },
    "Alt-Shift-Ctrl-Right": () => {
      tableEditor.moveColumn(1, opts);
    },
    "Alt-Shift-Cmd-Right": () => {
      tableEditor.moveColumn(1, opts);
    },
    "Alt-Shift-Ctrl-Up": () => {
      tableEditor.moveRow(-1, opts);
    },
    "Alt-Shift-Cmd-Up": () => {
      tableEditor.moveRow(-1, opts);
    },
    "Alt-Shift-Ctrl-Down": () => {
      tableEditor.moveRow(1, opts);
    },
    "Alt-Shift-Cmd-Down": () => {
      tableEditor.moveRow(1, opts);
    },
  };
  return new Map(Object.entries(obj));
};

const viewPlugin = ViewPlugin.define(() => ({}), {
  eventObservers: {
    keydown: (event, view: EditorView) => {
      const tableEditor = createTableEditor(view);
      if (!tableEditor.cursorIsInTable(opts)) {
        tableEditor.resetSmartCursor();
        return false;
      }
      const keyMap = keyMapOf(event, tableEditor);
      return keyMapWith(event.code, keyMap);
    },
  },
});

type KeyOperation = () => void;
const keyMapWith = (code: string, keyMap: Map<string, KeyOperation>) => {
  for (const [key, value] of keyMap) {
    if (key === code) {
      value();
      return true;
    }
  }
  return false;
};

export const betterTable = plugin({
  type: "default",
  value: () => {
    return viewPlugin;
  },
});
