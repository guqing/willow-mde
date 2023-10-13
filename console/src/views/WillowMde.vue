<template>
  <InkMde v-model="markdown" :options="options" class="willow-mde" />
</template>

<script lang="ts" setup>
import InkMde from "ink-mde/vue";
import { onMounted, reactive, ref } from "vue";
import { willowLightTheme } from "../plugins/willow-theme";
import { drawBetterSelection } from "../plugins/draw-selection";
import { computedAsync, useDebounceFn } from "@vueuse/core";
import remarkHtml from "../lib/remark";

type Metadata = {
  name: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp: string;
  deletionTimestamp: string;
};

type ConfigMap = {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  data?: Record<string, string>;
};

const markdown = ref("");

const html = computedAsync(async () => {
  return await remarkHtml(markdown.value);
}, null);

// debounce OnUpdate
const debounceOnUpdate = useDebounceFn(() => {
  emit("update:raw", markdown.value);
  emit("update:content", html.value || "");
}, 250);

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

onMounted(async () => {
  markdown.value = props.raw;

  try {
    const response = await fetch("/api/v1alpha1/configmaps/willow-mde-config");
    const configMap: ConfigMap = await response.json();
    const { vimMode, spellcheck } = JSON.parse(configMap.data?.basic as string);
    options.vim = vimMode;
    const interfaceOption = options.interface as Record<string, object>;
    interfaceOption.spellcheck = spellcheck;
  } catch (e) {
    // ignore this
  }
});

const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
}>();

const options: Record<string, unknown> = reactive({
  files: {
    clipboard: false,
    dragAndDrop: false,
    handler: () => {},
    injectMarkup: true,
    types: ["image/*"],
  },
  hooks: {
    afterUpdate: () => {
      debounceOnUpdate();
    },
  },
  interface: {
    appearance: "light",
    attribution: false,
    autocomplete: true,
    images: true,
    lists: true,
    readonly: false,
    spellcheck: false,
    toolbar: true,
  },
  katex: false,
  keybindings: {
    tab: true,
    shiftTab: true,
  },
  placeholder: "",
  plugins: [willowLightTheme, drawBetterSelection],
  readability: false,
  search: true,
  selections: [],
  toolbar: {
    bold: true,
    code: false,
    codeBlock: true,
    heading: true,
    image: false,
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
</script>

<style>
.ink {
  --ink-internal-syntax-monospace-font-family: ui-sans-serif, system-ui,
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
    Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    Segoe UI Symbol, "Noto Color Emoji" !important;
}

.willow-mde {
  background-color: #fff;
}

.ink-mde {
  height: 100%;
  border: none !important;
  border-radius: none !important;
}

.ink-mde-editor {
  padding: 1.5rem !important;
}
.ink-mde .ink-mde-toolbar .ink-mde-container {
  justify-content: center;
}

.ink-mde .ink-mde-toolbar {
  border-bottom-width: 1px;
  background-color: #fff !important;
}
.ink-mde .ink-mde-toolbar .ink-button {
  padding: 0.25em !important;
  border-radius: 0.125em !important;
}
.ink-mde .ink-mde-toolbar .ink-button svg {
  height: 1.4em !important;
  width: 1.4em !important;
}
.cm-focused {
  outline: unset !important;
}
</style>
