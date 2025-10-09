<script lang="ts" setup>
import { ink } from "ink-mde";
import type * as Ink from "ink-mde";
import {
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
  type Ref,
} from "vue";
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

const willowRef: Ref<HTMLElement | null> = ref(null);
const editorInstance = shallowRef<Ink.Instance>();
const editorConfig = ref<EditorConfig>();

async function handleFetchConfig() {
  const response = await fetch(
    "/apis/api.willow.guqing.github.io/editor-options"
  );
  editorConfig.value = (await response.json()) as EditorConfig;
}

onMounted(handleFetchConfig);

watchEffect(() => {
  if (willowRef.value && editorConfig.value) {
    const { vimMode, spellcheck, vimEscKeyMapping } =
      editorConfig.value.basic || {};

    editorInstance.value = ink(willowRef.value, {
      doc: props.raw,
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
        spellcheck: spellcheck,
        toolbar: false,
      },
      katex: false,
      keybindings: {
        tab: true,
        shiftTab: true,
      },
      placeholder: "",
      plugins: [willowLightTheme, selectionMark],
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
      vim: vimMode,
      hooks: {
        afterUpdate(doc: string) {
          renderToHtml(doc).then((html) => {
            emit("update:raw", doc || "");
            emit("update:content", html || "");
            emit("update", doc || "");
          });
        },
      },
    });

    if (hasEscKeyMapping(vimEscKeyMapping)) {
      if (vimMode) {
        Vim.map(vimEscKeyMapping, "<Esc>", "insert");
      } else {
        Vim.unmap(vimEscKeyMapping, "insert");
      }
    }

    willowRef.value.addEventListener("input", ((event: InputEvent) => {
      event.stopPropagation();
    }) as EventListener);
  }
});

watch(
  () => props.raw,
  (newRaw) => {
    if (editorInstance.value?.getDoc() !== newRaw) {
      editorInstance.value?.update(newRaw);
    }
  }
);

onUnmounted(() => {
  editorInstance.value?.destroy();
});
</script>

<template>
  <Toolbar v-if="editorInstance" :editor="editorInstance" />
  <div ref="willowRef" class="willow-mde"></div>
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
