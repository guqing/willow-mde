import { plugin } from "ink-mde";
import { createTableEditor } from "@/lib/mte-kernel";
import { options, TableEditor, Alignment } from "@susisu/mte-kernel";
import { Decoration, EditorView, ViewPlugin, keymap } from "@codemirror/view";
import { buildWidget } from "@/lib/codemirror-kit/decorations";
import { RangeSet, StateField } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import type { DecorationSet, KeyBinding } from "@codemirror/view";
import { insertNewlineAndIndent } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { TableRangeDetector } from "@/lib/mte-kernel/table-helper";
import { renderMarkdownFregment } from "@/lib/remark";
import { priorRunHandlers, buildKeymap } from "@/lib/codemirror-kit/keymap";

// options for the table editor
const opts = options({
  smartCursor: true,
  cursorIsInTable: true,
});

const keyMapOf = (
  view: EditorView,
  tableEditor: TableEditor
): ReadonlyArray<KeyBinding> => {
  const tableKeyMap: ReadonlyArray<KeyBinding> = [
    { key: "Tab", run: () => tableEditor.nextCell(opts) },
    { key: "Shift-Tab", run: () => tableEditor.previousCell(opts) },
    {
      key: "Enter",
      run: () => {
        if (tableEditor._textEditor.getCursorPosition().column !== 0) {
          tableEditor.nextRow(opts);
          return true;
        }
        return insertNewlineAndIndent(view);
      },
    },
    { key: "Ctrl-Enter", run: () => tableEditor.escape(opts) },
    { key: "Cmd-Enter", run: () => tableEditor.escape(opts) },
    {
      key: "Shift-Ctrl-Left",
      run: () => tableEditor.alignColumn(Alignment.LEFT, opts),
    },
    {
      key: "Shift-Cmd-Left",
      run: () => tableEditor.alignColumn(Alignment.LEFT, opts),
    },
    {
      key: "Shift-Ctrl-Right",
      run: () => tableEditor.alignColumn(Alignment.RIGHT, opts),
    },
    {
      key: "Shift-Cmd-Right",
      run: () => tableEditor.alignColumn(Alignment.RIGHT, opts),
    },
    {
      key: "Shift-Ctrl-Up",
      run: () => tableEditor.alignColumn(Alignment.CENTER, opts),
    },
    {
      key: "Shift-Cmd-Up",
      run: () => tableEditor.alignColumn(Alignment.CENTER, opts),
    },
    {
      key: "Shift-Ctrl-Down",
      run: () => tableEditor.alignColumn(Alignment.NONE, opts),
    },
    {
      key: "Shift-Cmd-Down",
      run: () => tableEditor.alignColumn(Alignment.NONE, opts),
    },
    { key: "Ctrl-Left", run: () => tableEditor.moveFocus(0, -1, opts) },
    { key: "Cmd-Left", run: () => tableEditor.moveFocus(0, -1, opts) },
    { key: "Ctrl-Right", run: () => tableEditor.moveFocus(0, 1, opts) },
    { key: "Cmd-Right", run: () => tableEditor.moveFocus(0, 1, opts) },
    { key: "Ctrl-Up", run: () => tableEditor.moveFocus(-1, 0, opts) },
    { key: "Cmd-Up", run: () => tableEditor.moveFocus(-1, 0, opts) },
    { key: "Ctrl-Down", run: () => tableEditor.moveFocus(1, 0, opts) },
    { key: "Cmd-Down", run: () => tableEditor.moveFocus(1, 0, opts) },
    { key: "Ctrl-K Ctrl-I", run: () => tableEditor.insertRow(opts) },
    { key: "Cmd-K Cmd-I", run: () => tableEditor.insertRow(opts) },
    { key: "Ctrl-L Ctrl-I", run: () => tableEditor.deleteRow(opts) },
    { key: "Cmd-L Cmd-I", run: () => tableEditor.deleteRow(opts) },
    { key: "Ctrl-K Ctrl-J", run: () => tableEditor.insertColumn(opts) },
    { key: "Cmd-K Cmd-J", run: () => tableEditor.insertColumn(opts) },
    { key: "Ctrl-L Ctrl-J", run: () => tableEditor.deleteColumn(opts) },
    { key: "Cmd-L Cmd-J", run: () => tableEditor.deleteColumn(opts) },
    { key: "Alt-Shift-Ctrl-Left", run: () => tableEditor.moveColumn(-1, opts) },
    { key: "Alt-Shift-Cmd-Left", run: () => tableEditor.moveColumn(-1, opts) },
    { key: "Alt-Shift-Ctrl-Right", run: () => tableEditor.moveColumn(1, opts) },
    { key: "Alt-Shift-Cmd-Right", run: () => tableEditor.moveColumn(1, opts) },
    { key: "Alt-Shift-Ctrl-Up", run: () => tableEditor.moveRow(-1, opts) },
    { key: "Alt-Shift-Cmd-Up", run: () => tableEditor.moveRow(-1, opts) },
    { key: "Alt-Shift-Ctrl-Down", run: () => tableEditor.moveRow(1, opts) },
    { key: "Alt-Shift-Cmd-Down", run: () => tableEditor.moveRow(1, opts) },
  ];
  return tableKeyMap;
};

const viewPlugin = ViewPlugin.define(() => ({}), {
  eventObservers: {
    keydown: (event, view: EditorView) => {
      const tableEditor = createTableEditor(view);
      if (!tableEditor.cursorIsInTable(opts)) {
        tableEditor.resetSmartCursor();
        return false;
      }
      event.preventDefault();
      return priorRunHandlers(keyMapOf(view, tableEditor), view, event);
    },
  },
});

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
