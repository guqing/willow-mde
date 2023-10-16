<script lang="ts" setup>
import type * as Ink from "ink-mde";
import MdiFormatBold from "~icons/mdi/format-bold";
import MdiFormatHeaderUp from "~icons/mdi/format-header-up";
import MdiFormatItalic from '~icons/mdi/format-italic'
import MdiFormatQuoteCloseOutline from '~icons/mdi/format-quote-close-outline'
import MdiCodeTags from '~icons/mdi/code-tags'
import MdiApplicationBracketsOutline from '~icons/mdi/application-brackets-outline'
import MdiFormatListBulletedSquare from '~icons/mdi/format-list-bulleted-square'
import MdiFormatListNumbered from '~icons/mdi/format-list-numbered'
import MdiFormatListChecks from '~icons/mdi/format-list-checks'

enum Markup {
  Bold = "bold",
  Code = "code",
  CodeBlock = "code_block",
  Heading = "heading",
  Image = "image",
  Italic = "italic",
  Link = "link",
  List = "list",
  OrderedList = "ordered_list",
  Quote = "quote",
  TaskList = "task_list",
}

const props = defineProps<{
  editor: Ink.Instance;
}>();

const formatAs = (type: Markup) => {
  props.editor.format(type, {});
};

const actions = [
  {
    type: Markup.Heading,
    icon: MdiFormatHeaderUp,
    onclick: () => formatAs(Markup.Heading),
  },
  {
    type: Markup.Bold,
    icon: MdiFormatBold,
    onclick: () => formatAs(Markup.Bold),
  },
  {
    type: Markup.Italic,
    icon: MdiFormatItalic,
    onclick: () => formatAs(Markup.Italic),
  },
  {
    type: Markup.Quote,
    icon: MdiFormatQuoteCloseOutline,
    onclick: () => formatAs(Markup.Quote),
  },
  {
    type: Markup.CodeBlock,
    icon: MdiApplicationBracketsOutline,
    onclick: () => formatAs(Markup.CodeBlock),
  },{
    type: Markup.Code,
    icon: MdiCodeTags,
    onclick: () => formatAs(Markup.Code),
  },
  {
    type: Markup.List,
    icon: MdiFormatListBulletedSquare,
    onclick: () => formatAs(Markup.List),
  },
  {
    type: Markup.OrderedList,
    icon: MdiFormatListNumbered,
    onclick: () => formatAs(Markup.OrderedList),
  },
  {
    type: Markup.TaskList,
    icon: MdiFormatListChecks,
    onclick: () => formatAs(Markup.TaskList),
  }
];
</script>
<template>
  <div class="willow-mde-toolbar">
    <div class="willow-mde-container">
      <button
        class="willow-button"
        v-for="action in actions"
        :key="action.type"
        @click="action.onclick"
        type="button"
      >
        <component :is="action.icon" />
      </button>
    </div>
  </div>
</template>
<style scoped>
.willow-mde-toolbar {
  border-bottom-width: 1px;
  background-color: #fff;
  color: rgba(var(--colors-secondary), var(--tw-text-opacity));
  display: flex;
  flex-shrink: 0;
  overflow-x: auto;
  padding: 0.25rem;
  justify-content: center;
}

.willow-mde-toolbar .willow-mde-container {
  display: flex;
  gap: 0.2rem;
}

.willow-mde-toolbar .willow-button {
  height: 1.8rem;
  width: 1.8rem;
  align-items: center;
  background: none;
  border: none;
  border-radius: 0.125rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  padding: 0.25rem;
}

.willow-mde-toolbar .willow-button:hover {
  background-color: rgb(243 244 246);
}

.willow-mde-toolbar .willow-button > * {
  align-items: center;
  display: flex;
  height: 100%;
}
</style>
