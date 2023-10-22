import { plugin } from "ink-mde";
import { createTableEditor } from "@/lib/mte-kernel";
import { options, TableEditor, Alignment } from "@susisu/mte-kernel";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import { buildWidget } from "@/lib/codemirror-kit/decorations";
import { RangeSet, StateField } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TableRangeDetector } from "@/lib/mte-kernel/table-helper";
import { renderMarkdownFregment } from "@/lib/remark";

// options for the table editor
const opts = options({
  smartCursor: true,
  cursorIsInTable: true,
});

const keyMapOf = (
  event: KeyboardEvent,
  tableEditor: TableEditor
): Map<string, KeyOperation> => {
  console.log(event);
  const obj = {
    Tab: (): void => {
      event.preventDefault();
      tableEditor.nextCell(opts);
    },
    "Shift-Tab": () => {
      tableEditor.previousCell(opts);
    },
    Enter: () => {
      if(tableEditor._textEditor.getCursorPosition().column !== 0) {
        tableEditor.nextRow(opts);
        event.preventDefault();
        return;
      }
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
    return [viewPlugin, tableExtension()];
  },
});

const tableWidget = (tableHtml: string) =>
  buildWidget({
    ignoreEvent: () => false,
    toDOM: () => {
      const container = document.createElement("div");
      container.innerHTML = tableHtml;

      const table = container.querySelector("table");
      if (!table) {
        throw new Error("table element not found");
      }

      table.setAttribute("aria-hidden", "true");
      table.className = "willow-mde-table";
      table.style.height = "100%";

      return table;
    },
  });

const tableExtension = (): Extension => {
  const tableDecoration = (tableHtml: string) =>
    Decoration.replace({
      widget: tableWidget(tableHtml),
    });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];

    const tableRangeDetector = new TableRangeDetector(state);
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (
          type.name === "Table" &&
          !tableRangeDetector.cursorIsInTable(opts)
        ) {
          const tableText = state.sliceDoc(from, to);
          const tableHtml = renderMarkdownFregment(tableText);
          widgets.push(tableDecoration(tableHtml).range(from, to));
        }
      },
    });

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
  };

  const stateField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state);
    },
    update(_references, { state }) {
      return decorate(state);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  const tableView = EditorView.theme({
    ".willow-mde-table": {
      width: "max-content",
      maxWidth: "100%",
      overflow: "auto",
      "--willow-table-border-color": "#C8CCD0",
    },
    ".willow-mde-table thead": {
      display: "table-header-group",
      verticalAlign: "middle",
      borderColor: "var(--willow-table-border-color)",
    },
    ".willow-mde-table tr:nth-child(2n)": {
      backgroundColor: "#F5F8FA",
    },
    ".willow-mde-table th, td": {
      padding: "6px 13px",
      border: "1px solid var(--willow-table-border-color)",
    },
    ".willow-mde-table th": {
      fontWeight: "600",
    },
    ".willow-mde-table tbody": {
      display: "table-row-group",
      verticalAlign: "middle",
      borderColor: "var(--willow-table-border-color)",
    },
    ".willow-mde-table tr": {
      borderTop: "1px solid #1F2328",
      display: "table-row",
      verticalAlign: "inherit",
      borderColor: "var(--willow-table-border-color)",
    },
  });

  return [stateField, tableView];
};
