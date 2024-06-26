<script lang="ts" setup>
import { ink } from "ink-mde";
import type * as Ink from "ink-mde";
import { onMounted, reactive, ref, watch, type Ref } from "vue";
import { computedAsync, useDebounceFn } from "@vueuse/core";
import { renderToHtml } from "@/lib/remark";
import { willowLightTheme } from "../plugins/willow-theme";
import { Toolbar } from "../components/toolbar";
import { selectionMark } from "../plugins/selection-mark";
import { Vim } from "@replit/codemirror-vim";

type EditorConfig = {
  basic: {
    vimMode: boolean;
    vimEscKeyMapping?: string;
    spellcheck: boolean;
  };
};

const hasEscKeyMapping = (vimEscKeyMapping: string | undefined) => {
  return vimEscKeyMapping && vimEscKeyMapping.trim().length > 0;
};

const willow: Ref<HTMLElement | null> = ref(null);
const markdown = ref("");
const editor = ref<Ink.Instance>();

const props = withDefaults(
  defineProps<{
    raw?: string;
    content: string;
  }>(),
  {
    raw: "",
    content: "",
  }
);

const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
  (event: "update", value: string): void;
}>();

// debounce OnUpdate
const debounceOnUpdate = useDebounceFn(() => {
  emit("update:raw", markdown.value);
  emit("update:content", html.value || "");
  emit("update", markdown.value);
}, 250);

const options: Ink.Options = reactive({
  doc: markdown.value,
  hooks: {
    afterUpdate: (doc: string) => {
      markdown.value = doc;
      debounceOnUpdate();
    },
  },
  files: {
    clipboard: false,
    dragAndDrop: false,
    handler: () => {
      return;
    },
    injectMarkup: true,
    types: ["image/*"],
  },
  interface: {
    appearance: "light" as const,
    attribution: false,
    autocomplete: true,
    images: true,
    lists: true,
    readonly: false,
    spellcheck: false,
    toolbar: false,
  },
  katex: false,
  keybindings: {
    tab: true,
    shiftTab: true,
  },
  placeholder: "",
  plugins: [],
  readability: false,
  search: true,
  selections: [],
  toolbar: {
    bold: true,
    code: false,
    codeBlock: true,
    heading: true,
    image: true,
    italic: true,
    link: true,
    list: true,
    orderedList: true,
    quote: true,
    taskList: true,
    upload: false,
  },
  // This value overrides both `tab` and `shiftTab` keybindings.
  trapTab: undefined,
  vim: false,
});

options.plugins?.push(willowLightTheme, selectionMark);

watch(options, (newValue) => {
  if (editor.value) {
    editor.value.reconfigure(newValue);
  }
});

watch(markdown, (newValue) => {
  if (editor.value?.getDoc() !== newValue) {
    editor.value?.update(newValue);
  }
});

const html = computedAsync(async () => {
  return await renderToHtml(markdown.value);
}, null);

onMounted(async () => {
  markdown.value = props.raw;

  if (willow.value) {
    editor.value = ink(willow.value, options);

    willow.value.addEventListener("input", ((event: InputEvent) => {
      event.stopPropagation();
    }) as EventListener);
  }

  try {
    const response = await fetch(
      "/apis/api.willow.guqing.github.io/editor-options"
    );
    const editorConfig: EditorConfig = await response.json();
    const { vimMode, spellcheck, vimEscKeyMapping } = editorConfig.basic || {};
    options.vim = vimMode;
    if (hasEscKeyMapping(vimEscKeyMapping)) {
      if (vimMode) {
        Vim.map(vimEscKeyMapping, "<Esc>", "insert");
      } else {
        Vim.unmap(vimEscKeyMapping, "insert");
      }
    }
    const interfaceOption = options.interface as Record<string, unknown>;
    interfaceOption.spellcheck = spellcheck;
  } catch (e) {
    // ignore this
    console.error(e);
  }
});
</script>

<template>
  <Toolbar v-if="editor" :editor="editor" />
  <div ref="willow" class="willow-mde"></div>
</template>

<style>
.ink {
  --ink-internal-syntax-monospace-font-family: ui-sans-serif, system-ui,
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
    Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    Segoe UI Symbol, "Noto Color Emoji" !important;
}

.willow-mde {
  background-color: #fff;
  height: 100%;
}

.ink-mde {
  height: 100%;
  border: none !important;
  border-radius: none !important;
}

.ink-mde-editor {
  padding: 1.5rem !important;
}

.willow-mde .cm-focused {
  outline: unset !important;
}

.willow-mde .cm-line img.cm-widgetBuffer {
  display: none !important;
  height: 0 !important;
}
</style>
