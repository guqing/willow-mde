import type { Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { ITextEditor, options, Point, TableEditor } from "@susisu/mte-kernel";

function posToOffset(doc: Text, pos: Point) {
  return doc.line(pos.line + 1).from + pos.ch;
}
function offsetToPos(doc: Text, offset: number) {
  let line = doc.lineAt(offset);
  return { line: line.number - 1, ch: offset - line.from };
}

type MteRange = {
  start: Point;
  end: Point;
};

// see https://github.dev/susisu/mte-demo/blob/34da442b9f0a5b634a4aaa84f48574202331bc19/src/main.js#L6
// see https://doc.esdoc.org/github.com/susisu/mte-kernel/class/lib/text-editor.js~ITextEditor.html
class TextEditorInterface extends ITextEditor {
  editor: EditorView;
  doc: Text;
  transaction: boolean;
  onDidFinishTransaction: (() => void) | null;
  constructor(view: EditorView) {
    super();
    this.editor = view;
    this.doc = view.state.doc;
    this.transaction = false;
    this.onDidFinishTransaction = null;
  }

  getCursorPosition() {
    const offset = this.editor.state.selection.main.head;
    const { line, ch } = offsetToPos(this.doc, offset);
    return new Point(line, ch);
  }

  setCursorPosition(pos: Point) {
    const anchor = posToOffset(this.doc, pos);
    this.editor.dispatch({ selection: { anchor: anchor } });
  }

  setSelectionRange(range: MteRange) {
    const anchorStart = posToOffset(this.doc, range);
    const anchorEnd = posToOffset(this.doc, range.end);
    this.editor.dispatch({
      selection: { anchor: anchorStart, head: anchorEnd },
    });
  }

  getLastRow() {
    return this.doc.lines - 1;
  }

  acceptsTableEdit() {
    return true;
  }

  getLine(row: number) {
    return this.doc.line(row + 1).text;
  }

  insertLine(row: number, line: string) {
    const lastRow = this.getLastRow();
    if (row > lastRow) {
      const lastLine = this.getLine(lastRow);
      const from = posToOffset(this.doc, {
        line: lastRow,
        ch: lastLine.length,
      });
      const to = posToOffset(this.doc, { line: lastRow, ch: lastLine.length });
      this.editor.dispatch({
        changes: { from, to, insert: "\n" + line },
      });
    } else {
      const from = posToOffset(this.doc, { line: row, ch: 0 });
      const to = posToOffset(this.doc, { line: row, ch: 0 });
      this.editor.dispatch({
        changes: { from, to, insert: line + "\n" },
      });
    }
  }

  deleteLine(row: number) {
    const lastRow = this.getLastRow();
    if (row >= lastRow) {
      if (lastRow > 0) {
        const preLastLine = this.getLine(lastRow - 1);
        const lastLine = this.getLine(lastRow);

        const from = posToOffset(this.doc, {
          line: lastRow - 1,
          ch: preLastLine.length,
        });
        const to = posToOffset(this.doc, {
          line: lastRow,
          ch: lastLine.length,
        });
        this.editor.dispatch({
          changes: { from, to, insert: "" },
        });
      } else {
        const lastLine = this.getLine(lastRow);
        const from = posToOffset(this.doc, { line: lastRow, ch: 0 });
        const to = posToOffset(this.doc, {
          line: lastRow,
          ch: lastLine.length,
        });
        this.editor.dispatch({
          changes: { from, to, insert: "" },
        });
      }
    } else {
      const from = posToOffset(this.doc, { line: row, ch: 0 });
      const to = posToOffset(this.doc, { line: row + 1, ch: 0 });
      this.editor.dispatch({
        changes: { from, to, insert: "" },
      });
    }
  }

  replaceLines(startRow: number, endRow: number, lines: string[]) {
    const lastRow = this.getLastRow();
    if (endRow > lastRow) {
      const lastLine = this.getLine(lastRow);
      const from = posToOffset(this.doc, { line: startRow, ch: 0 });
      const to = posToOffset(this.doc, { line: lastRow, ch: lastLine.length });
      this.editor.dispatch({
        changes: { from, to, insert: lines.join("\n") },
      });
    } else {
      const from = posToOffset(this.doc, { line: startRow, ch: 0 });
      const to = posToOffset(this.doc, { line: endRow, ch: 0 });
      this.editor.dispatch({
        changes: { from, to, insert: lines.join("\n") + "\n" },
      });
    }
  }

  transact(func: Function) {
    this.transaction = true;
    func();
    this.transaction = false;
    if (this.onDidFinishTransaction) {
      this.onDidFinishTransaction.call(undefined);
    }
  }

  init() {
    // create a table editor object
    const tableEditor = new TableEditor(this);
    // options for the table editor
    const opts = options({
      smartCursor: true,
      cursorIsInTable: true,
    });
    tableEditor.formatAll(options({}));

    // const keyMap = EditorView.key({
    //   Tab: () => {
    //     tableEditor.nextCell(opts);
    //   },
    //   "Shift-Tab": () => {
    //     tableEditor.previousCell(opts);
    //   },
    //   Enter: () => {
    //     tableEditor.nextRow(opts);
    //   },
    //   "Ctrl-Enter": () => {
    //     tableEditor.escape(opts);
    //   },
    //   "Cmd-Enter": () => {
    //     tableEditor.escape(opts);
    //   },
    //   "Shift-Ctrl-Left": () => {
    //     tableEditor.alignColumn(Alignment.LEFT, opts);
    //   },
    //   "Shift-Cmd-Left": () => {
    //     tableEditor.alignColumn(Alignment.LEFT, opts);
    //   },
    //   "Shift-Ctrl-Right": () => {
    //     tableEditor.alignColumn(Alignment.RIGHT, opts);
    //   },
    //   "Shift-Cmd-Right": () => {
    //     tableEditor.alignColumn(Alignment.RIGHT, opts);
    //   },
    //   "Shift-Ctrl-Up": () => {
    //     tableEditor.alignColumn(Alignment.CENTER, opts);
    //   },
    //   "Shift-Cmd-Up": () => {
    //     tableEditor.alignColumn(Alignment.CENTER, opts);
    //   },
    //   "Shift-Ctrl-Down": () => {
    //     tableEditor.alignColumn(Alignment.NONE, opts);
    //   },
    //   "Shift-Cmd-Down": () => {
    //     tableEditor.alignColumn(Alignment.NONE, opts);
    //   },
    //   "Ctrl-Left": () => {
    //     tableEditor.moveFocus(0, -1, opts);
    //   },
    //   "Cmd-Left": () => {
    //     tableEditor.moveFocus(0, -1, opts);
    //   },
    //   "Ctrl-Right": () => {
    //     tableEditor.moveFocus(0, 1, opts);
    //   },
    //   "Cmd-Right": () => {
    //     tableEditor.moveFocus(0, 1, opts);
    //   },
    //   "Ctrl-Up": () => {
    //     tableEditor.moveFocus(-1, 0, opts);
    //   },
    //   "Cmd-Up": () => {
    //     tableEditor.moveFocus(-1, 0, opts);
    //   },
    //   "Ctrl-Down": () => {
    //     tableEditor.moveFocus(1, 0, opts);
    //   },
    //   "Cmd-Down": () => {
    //     tableEditor.moveFocus(1, 0, opts);
    //   },
    //   "Ctrl-K Ctrl-I": () => {
    //     tableEditor.insertRow(opts);
    //   },
    //   "Cmd-K Cmd-I": () => {
    //     tableEditor.insertRow(opts);
    //   },
    //   "Ctrl-L Ctrl-I": () => {
    //     tableEditor.deleteRow(opts);
    //   },
    //   "Cmd-L Cmd-I": () => {
    //     tableEditor.deleteRow(opts);
    //   },
    //   "Ctrl-K Ctrl-J": () => {
    //     tableEditor.insertColumn(opts);
    //   },
    //   "Cmd-K Cmd-J": () => {
    //     tableEditor.insertColumn(opts);
    //   },
    //   "Ctrl-L Ctrl-J": () => {
    //     tableEditor.deleteColumn(opts);
    //   },
    //   "Cmd-L Cmd-J": () => {
    //     tableEditor.deleteColumn(opts);
    //   },
    //   "Alt-Shift-Ctrl-Left": () => {
    //     tableEditor.moveColumn(-1, opts);
    //   },
    //   "Alt-Shift-Cmd-Left": () => {
    //     tableEditor.moveColumn(-1, opts);
    //   },
    //   "Alt-Shift-Ctrl-Right": () => {
    //     tableEditor.moveColumn(1, opts);
    //   },
    //   "Alt-Shift-Cmd-Right": () => {
    //     tableEditor.moveColumn(1, opts);
    //   },
    //   "Alt-Shift-Ctrl-Up": () => {
    //     tableEditor.moveRow(-1, opts);
    //   },
    //   "Alt-Shift-Cmd-Up": () => {
    //     tableEditor.moveRow(-1, opts);
    //   },
    //   "Alt-Shift-Ctrl-Down": () => {
    //     tableEditor.moveRow(1, opts);
    //   },
    //   "Alt-Shift-Cmd-Down": () => {
    //     tableEditor.moveRow(1, opts);
    //   },
    // });

    const _this = this;

    function updateActiveState() {
      const active = tableEditor.cursorIsInTable(opts);
      //   if (active) {
      //     _this.editor.setOption("extraKeys", keyMap);
      //   } else {
      //     _this.editor.setOption("extraKeys", {
      //       Enter: "newlineAndIndentContinueMarkdownList",
      //     });
      //     tableEditor.resetSmartCursor();
      //   }
    }

    // event subscriptions
    // this.editor.on("cursorActivity", () => {
    //   if (!this.transaction) {
    //     updateActiveState();
    //   }
    // });
    // this.editor.on("changes", () => {
    //   if (!this.transaction) {
    //     updateActiveState();
    //   }
    // });

    this.onDidFinishTransaction = () => {
      updateActiveState();
    };
  }
}

export { TextEditorInterface };
