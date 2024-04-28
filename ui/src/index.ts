import { definePlugin, type EditorProvider } from "@halo-dev/console-shared";
import { markRaw } from "vue";
import WillowMde from "./views/WillowMde.vue";
import logo from './assets/logo.svg'

export default definePlugin({
  extensionPoints: {
    "editor:create": (): EditorProvider[] => {
      return [
        {
          name: "willow-mde",
          displayName: "Willow Markdown",
          component: markRaw(WillowMde),
          rawType: "markdown",
          logo: logo
        },
      ];
    },
  },
});
