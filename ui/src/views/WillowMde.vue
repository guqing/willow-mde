<script lang="ts" setup>
import { ink } from "ink-mde";
import type * as Ink from "ink-mde";
import {
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  nextTick,
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
const isInitialized = ref(false);

// 防止重复渲染
let renderTimer: number | null = null;
let lastDoc = "";

// 防抖的 afterUpdate 处理
const debouncedAfterUpdate = (doc: string) => {
  // 内容没变，跳过
  if (doc === lastDoc) return;
  lastDoc = doc;

  // 清除之前的定时器
  if (renderTimer) {
    clearTimeout(renderTimer);
  }

  // 300ms 防抖
  renderTimer = window.setTimeout(() => {
    renderToHtml(doc).then((html) => {
      emit("update:raw", doc || "");
      emit("update:content", html || "");
      emit("update", doc || "");
    });
  }, 300);
};

// 获取配置
async function fetchConfig() {
  try {
    const response = await fetch(
      "/apis/api.willow.guqing.github.io/editor-options"
    );
    if (response.ok) {
      editorConfig.value = (await response.json()) as EditorConfig;
    }
  } catch (error) {
    console.error("Failed to fetch editor config:", error);
    // 使用默认配置
    editorConfig.value = {
      basic: {
        vimMode: false,
        spellcheck: true,
        vimEscKeyMapping: "",
      },
    };
  }
}

// 初始化编辑器（只执行一次）
async function initializeEditor() {
  if (isInitialized.value || !willowRef.value) return;

  await fetchConfig();
  await nextTick();

  if (!editorConfig.value) return;

  const { vimMode, spellcheck, vimEscKeyMapping } =
    editorConfig.value.basic || {};

  // 确保销毁旧实例
  if (editorInstance.value) {
    editorInstance.value.destroy();
    editorInstance.value = undefined;
  }

  editorInstance.value = ink(willowRef.value, {
    doc: props.raw,
    files: {
      clipboard: false,
      dragAndDrop: false,
      handler: () => {},
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
    trapTab: undefined,
    vim: vimMode,
    hooks: {
      afterUpdate: debouncedAfterUpdate,
    },
  });

  // 配置 Vim 快捷键
  if (hasEscKeyMapping(vimEscKeyMapping)) {
    if (vimMode) {
      Vim.map(vimEscKeyMapping, "<Esc>", "insert");
    } else {
      Vim.unmap(vimEscKeyMapping, "insert");
    }
  }

  // 阻止事件冒泡
  const inputHandler = (event: InputEvent) => {
    event.stopPropagation();
  };
  willowRef.value.addEventListener("input", inputHandler as EventListener);

  isInitialized.value = true;
}

// 监听外部 raw 变化（只在必要时更新）
watch(
  () => props.raw,
  (newRaw) => {
    if (!editorInstance.value) return;
    
    const currentDoc = editorInstance.value.getDoc();
    // 只在内容真正不同时才更新
    if (currentDoc !== newRaw) {
      editorInstance.value.update(newRaw);
    }
  }
);

// 监听配置变化（动态更新编辑器配置）
watch(
  () => editorConfig.value,
  (newConfig, oldConfig) => {
    if (!editorInstance.value || !newConfig || !isInitialized.value) return;

    const newBasic = newConfig.basic;
    const oldBasic = oldConfig?.basic;

    // 只在配置真正改变时重新初始化
    if (
      newBasic?.vimMode !== oldBasic?.vimMode ||
      newBasic?.spellcheck !== oldBasic?.spellcheck ||
      newBasic?.vimEscKeyMapping !== oldBasic?.vimEscKeyMapping
    ) {
      console.log("Config changed, reinitializing editor...");
      isInitialized.value = false;
      initializeEditor();
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeEditor();
});

onUnmounted(() => {
  // 清理定时器
  if (renderTimer) {
    clearTimeout(renderTimer);
  }
  // 销毁编辑器实例
  if (editorInstance.value) {
    editorInstance.value.destroy();
    editorInstance.value = undefined;
  }
  isInitialized.value = false;
  lastDoc = "";
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
