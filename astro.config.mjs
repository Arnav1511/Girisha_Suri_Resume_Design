import { defineConfig } from "astro/config";
import { devApiMiddleware } from "./tools/devApiMiddleware.ts";

// https://astro.build/config
export default defineConfig({
  output: "static",
  vite: {
    plugins: [devApiMiddleware()],
  },
});
