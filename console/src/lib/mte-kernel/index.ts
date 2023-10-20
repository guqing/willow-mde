import type { SelectionRange, Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { ITextEditor, Point, TableEditor } from "@susisu/mte-kernel";

type VendorPoint = {
  line: number;
  ch: number;
};

const posToOffset = (doc: Text, pos: VendorPoint): number => {
  return doc.line(pos.line + 1).from + pos.ch;
};

const offsetToPos = (doc: Text, offset: number): VendorPoint => {
  let line = doc.lineAt(offset);
  return { line: line.number - 1, ch: offset - line.from };
};

const updateSelectionRange = (
  view: EditorView,
  from: Point,
  to: Point,
  line: string
) => {
  const doc = view.state.doc;
  view.dispatch({
    changes: {
      from: posToOffset(doc, from),
      to: posToOffset(doc, to),
      insert: line,
    },
  });
};

type MteRange = {
  start: Point;
  end: Point;
};

// see https://github.dev/susisu/mte-demo/blob/34da442b9f0a5b634a4aaa84f48574202331bc19/src/main.js#L6
// see https://doc.esdoc.org/github.com/susisu/mte-kernel/class/lib/text-editor.js~ITextEditor.html
class TextTableEditor extends ITextEditor {
  editor: EditorView;
  transaction: boolean;
  onDidFinishTransaction: (() => void) | null;
  constructor(view: EditorView) {
    super();
    this.editor = view;
    this.transaction = false;
    this.onDidFinishTransaction = null;
  }

  getCursorPosition() {
    const offset = this.editor.state.selection.main.head;
    const { line, ch }: VendorPoint = offsetToPos(
      this.editor.state.doc,
      offset
    );
    return new Point(line, ch) as Point;
  }

  setCursorPosition(pos: Point) {
    const doc = this.editor.state.doc;
    const anchor = posToOffset(doc, {
      line: pos.row,
      ch: pos.column,
    } as Point);
    this.editor.dispatch({ selection: { anchor: anchor } as SelectionRange });
  }

  setSelectionRange(range: MteRange) {
    const doc = this.editor.state.doc;
    const anchorStart: number = posToOffset(doc, {
      line: range.start.row,
      ch: range.start.column,
    } as VendorPoint);
    const anchorEnd: number = posToOffset(doc, {
      line: range.end.row,
      ch: range.end.column,
    } as VendorPoint);
    this.editor.dispatch({
      selection: { anchor: anchorStart, head: anchorEnd },
    });
  }

  getLastRow() {
    return this.editor.state.doc.lines - 1;
  }

  acceptsTableEdit() {
    return true;
  }

  getLine(row: number) {
    return this.editor.state.doc.line(row + 1).text;
  }

  insertLine(row: number, line: string) {
    const lastRow = this.getLastRow();
    if (row > lastRow) {
      const lastLine = this.getLine(lastRow);
      updateSelectionRange(
        this.editor,
        { line: lastRow, ch: lastLine.length },
        { line: lastRow, ch: lastLine.length },
        "\n" + line
      );
    } else {
      updateSelectionRange(
        this.editor,
        { line: row, ch: 0 },
        { line: row, ch: 0 },
        line + "\n"
      );
    }
  }

  deleteLine(row: number) {
    const lastRow = this.getLastRow();
    if (row >= lastRow) {
      if (lastRow > 0) {
        const preLastLine = this.getLine(lastRow - 1);
        const lastLine = this.getLine(lastRow);

        updateSelectionRange(
          this.editor,
          { line: lastRow - 1, ch: preLastLine.length },
          { line: lastRow, ch: lastLine.length },
          ""
        );
      } else {
        const lastLine = this.getLine(lastRow);
        updateSelectionRange(
          this.editor,
          { line: lastRow, ch: 0 },
          { line: lastRow, ch: lastLine.length },
          ""
        );
      }
    } else {
      updateSelectionRange(
        this.editor,
        { line: row, ch: 0 },
        { line: row + 1, ch: 0 },
        ""
      );
    }
  }

  replaceLines(startRow: number, endRow: number, lines: string[]) {
    const lastRow = this.getLastRow();
    if (endRow > lastRow) {
      const lastLine = this.getLine(lastRow);
      updateSelectionRange(
        this.editor,
        { line: startRow, ch: 0 },
        { line: lastRow, ch: lastLine.length },
        lines.join("\n")
      );
    } else {
      updateSelectionRange(
        this.editor,
        { line: startRow, ch: 0 },
        { line: endRow, ch: 0 },
        lines.join("\n") + "\n"
      );
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
}

export const createTableEditor = (view: EditorView) => {
  return new TableEditor(new TextTableEditor(view));
};
