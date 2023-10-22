import { base, shift, keyName } from "w3c-keyname";
import { codePointSize, codePointAt } from "@codemirror/state";
import { keymap, type Command, type EditorView, type KeyBinding } from "@codemirror/view";
import browser from "./browser";

export function priorRunHandlers(bindings: readonly KeyBinding[], view: EditorView, event: KeyboardEvent) {
  const keyMap = getKeymap(bindings, view);
  console.log(keyMap)
  return runHandlers(keyMap, event, view, "editor")
}

function getKeymap(bindings: readonly KeyBinding[], view: EditorView) {
  const facetKeymap = view.state.facet(keymap);
  const existingBindings = facetKeymap.reduce((a, b) => a.concat(b), [])
  const merged = concatArray(existingBindings, bindings)
  return buildKeymap(merged, currentPlatform)
}

function concatArray(array: readonly KeyBinding[], append: readonly KeyBinding[]) {
  const map = new Map();
  array?.forEach(item => {
    map.set(item.key, item);
  })
  append?.forEach(item => {
    map.set(item.key, item);
  })
  return Array.from(map.values());
}

// code referenced from https://github.com/codemirror/view/blob/main/src/keymap.ts below:

// Key codes for modifier keys
export const modifierCodes = [16, 17, 18, 20, 91, 92, 224, 225];

type PlatformName = "mac" | "win" | "linux" | "key";

export function normalizeKeyName(name: string, platform: PlatformName): string {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1];
  if (result == "Space") result = " ";
  let alt, ctrl, shift, meta;
  for (let i = 0; i < parts.length - 1; ++i) {
    const mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) meta = true;
    else if (/^a(lt)?$/i.test(mod)) alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
    else if (/^s(hift)?$/i.test(mod)) shift = true;
    else if (/^mod$/i.test(mod)) {
      if (platform == "mac") meta = true;
      else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}

function modifiers(name: string, event: KeyboardEvent, shift: boolean) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift !== false && event.shiftKey) name = "Shift-" + name;
  return name;
}

type Binding = {
  preventDefault: boolean;
  stopPropagation: boolean;
  run: ((view: EditorView, event: KeyboardEvent) => boolean)[];
};

// In each scope, the `_all` property is used for bindings that apply
// to all keys.
type Keymap = { [scope: string]: { [key: string]: Binding } };

let storedPrefix: { view: EditorView; prefix: string; scope: string } | null =
  null;
const currentPlatform: PlatformName = browser.mac
  ? "mac"
  : browser.windows
  ? "win"
  : browser.linux
  ? "linux"
  : "key";

const PrefixTimeout = 4000;

export function buildKeymap(
  bindings: readonly KeyBinding[],
  platform = currentPlatform
) {
  let bound: Keymap = Object.create(null);
  let isPrefix: { [prefix: string]: boolean } = Object.create(null);

  let checkPrefix = (name: string, is: boolean) => {
    let current = isPrefix[name];
    if (current == null) isPrefix[name] = is;
    else if (current != is)
      throw new Error(
        "Key binding " +
          name +
          " is used both as a regular binding and as a multi-stroke prefix"
      );
  };

  let add = (
    scope: string,
    key: string,
    command: Command | undefined,
    preventDefault?: boolean,
    stopPropagation?: boolean
  ) => {
    let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
    let parts = key.split(/ (?!$)/).map((k) => normalizeKeyName(k, platform));
    for (let i = 1; i < parts.length; i++) {
      let prefix = parts.slice(0, i).join(" ");
      checkPrefix(prefix, true);
      if (!scopeObj[prefix])
        scopeObj[prefix] = {
          preventDefault: true,
          stopPropagation: false,
          run: [
            (view: EditorView) => {
              let ourObj = (storedPrefix = { view, prefix, scope });
              setTimeout(() => {
                if (storedPrefix == ourObj) storedPrefix = null;
              }, PrefixTimeout);
              return true;
            },
          ],
        };
    }
    let full = parts.join(" ");
    checkPrefix(full, false);
    let binding =
      scopeObj[full] ||
      (scopeObj[full] = {
        preventDefault: false,
        stopPropagation: false,
        run: scopeObj._any?.run?.slice() || [],
      });
    if (command) binding.run.push(command);
    if (preventDefault) binding.preventDefault = true;
    if (stopPropagation) binding.stopPropagation = true;
  };

  for (let b of bindings) {
    let scopes = b.scope ? b.scope.split(" ") : ["editor"];
    if (b.any)
      for (let scope of scopes) {
        let scopeObj = bound[scope] || (bound[scope] = Object.create(null));
        if (!scopeObj._any)
          scopeObj._any = {
            preventDefault: false,
            stopPropagation: false,
            run: [],
          };
        for (let key in scopeObj) scopeObj[key].run.push(b.any);
      }
    let name = b[platform] || b.key;
    if (!name) continue;
    for (let scope of scopes) {
      add(scope, name, b.run, b.preventDefault, b.stopPropagation);
      if (b.shift)
        add(
          scope,
          "Shift-" + name,
          b.shift,
          b.preventDefault,
          b.stopPropagation
        );
    }
  }
  return bound;
}

export function runHandlers(
  map: Keymap,
  event: KeyboardEvent,
  view: EditorView,
  scope: string
): boolean {
  let name = keyName(event);
  let charCode = codePointAt(name, 0),
    isChar = codePointSize(charCode) == name.length && name != " ";
  let prefix = "",
    handled = false,
    prevented = false,
    stopPropagation = false;
  if (
    storedPrefix &&
    storedPrefix.view == view &&
    storedPrefix.scope == scope
  ) {
    prefix = storedPrefix.prefix + " ";
    if (modifierCodes.indexOf(event.keyCode) < 0) {
      prevented = true;
      storedPrefix = null;
    }
  }

  let ran: Set<(view: EditorView, event: KeyboardEvent) => boolean> = new Set();
  let runFor = (binding: Binding | undefined) => {
    if (binding) {
      for (let cmd of binding.run)
        if (!ran.has(cmd)) {
          ran.add(cmd);
          if (cmd(view, event)) {
            if (binding.stopPropagation) stopPropagation = true;
            return true;
          }
        }
      if (binding.preventDefault) {
        if (binding.stopPropagation) stopPropagation = true;
        prevented = true;
      }
    }
    return false;
  };

  let scopeObj = map[scope],
    baseName,
    shiftName;
  if (scopeObj) {
    if (runFor(scopeObj[prefix + modifiers(name, event, !isChar)])) {
      handled = true;
    } else if (
      isChar &&
      (event.altKey || event.metaKey || event.ctrlKey) &&
      // Ctrl-Alt may be used for AltGr on Windows
      !(browser.windows && event.ctrlKey && event.altKey) &&
      (baseName = base[event.keyCode]) &&
      baseName != name
    ) {
      if (runFor(scopeObj[prefix + modifiers(baseName, event, true)])) {
        handled = true;
      } else if (
        event.shiftKey &&
        (shiftName = shift[event.keyCode]) != name &&
        shiftName != baseName &&
        runFor(scopeObj[prefix + modifiers(shiftName, event, false)])
      ) {
        handled = true;
      }
    } else if (
      isChar &&
      event.shiftKey &&
      runFor(scopeObj[prefix + modifiers(name, event, true)])
    ) {
      handled = true;
    }
    if (!handled && runFor(scopeObj._any)) handled = true;
  }

  if (prevented) handled = true;
  if (handled && stopPropagation) event.stopPropagation();
  return handled;
}
