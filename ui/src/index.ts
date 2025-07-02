import { definePlugin, type EditorProvider } from "@halo-dev/console-shared";
import { defineAsyncComponent } from "vue";
import logo from "./assets/logo.svg";
import { VLoading } from "@halo-dev/components";

export default definePlugin({
  extensionPoints: {
    "editor:create": (): EditorProvider[] => {
      return [
        {
          name: "willow-mde",
          displayName: "Willow Markdown",
          component: defineAsyncComponent({
            loader: () => import("./views/WillowMde.vue"),
            loadingComponent: VLoading,
          }),
          rawType: "markdown",
          logo: logo,
        },
      ];
    },
  },
});
