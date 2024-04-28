import type { EditorState, Text as VendorText } from "@codemirror/state";
import { Point } from "@susisu/mte-kernel";

type VendorPoint = {
  line: number;
  ch: number;
};

const offsetToPos = (doc: VendorText, offset: number): VendorPoint => {
  let line = doc.lineAt(offset);
  return { line: line.number - 1, ch: offset - line.from };
};

/**
 * Creates a regex source string of margin character class.
 *
 * @private
 * @param {Set<string>} chars - A set of additional margin characters.
 * A pipe `|`, a backslash `\`, and a backquote will be ignored.
 * @return {string} A regex source string.
 */
function marginRegexSrc(chars: Set<string>) {
  let cs = "";
  for (const c of chars) {
    if (c !== "|" && c !== "\\" && c !== "`") {
      cs += `\\u{${c.codePointAt(0).toString(16)}}`;
    }
  }
  return `[\\s${cs}]*`;
}

/**
 * Creates a regular expression object that matches a table row.
 *
 * @param {Set<string>} leftMarginChars - A set of additional left margin characters.
 * A pipe `|`, a backslash `\`, and a backquote will be ignored.
 * @returns {RegExp} A regular expression object that matches a table row.
 */
function _createIsTableRowRegex(leftMarginChars: Set<string>) {
  return new RegExp(`^${marginRegexSrc(leftMarginChars)}\\|`, "u");
}

class TableRangeDetector {
  state: EditorState;
  constructor(state: EditorState) {
    this.state = state;
  }

  getLine(row: number) {
    return this.state.doc.line(row + 1).text;
  }

  /*
   * Checks if the cursor is in a table row.
   * This is useful to check whether the table editor should be activated or not.
   *
   * @param {Object} options - See {@link options}.
   * @returns {boolean} `true` if the cursor is in a table row.
   */
  cursorIsInTable(options) {
    const re = _createIsTableRowRegex(options.leftMarginChars);
    const pos = this.getCursorPosition();
    return re.test(this.getLine(pos.row));
  }

  getCursorPosition() {
    const offset = this.state.selection.main.head;
    const { line, ch }: VendorPoint = offsetToPos(this.state.doc, offset);
    return new Point(line, ch) as Point;
  }
}

export { TableRangeDetector };
