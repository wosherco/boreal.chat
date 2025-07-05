import { sentrySvelteKit } from "@sentry/sveltekit";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: "borealchat",
        project: "webapp",
      },
    }),
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
    }),
  ],
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
  worker: {
    format: "es",
  },
  ssr: {
    noExternal: [
      "@lucide/svelte",
      "sveltekit-superforms",
      "formsnap"
    ],
  },
  build: {
    rollupOptions: {
      external: [
        "@tanstack/svelte-query",
        "@tanstack/svelte-query-devtools",
        "@tanstack/svelte-query-persist-client",
        "@tanstack/query-async-storage-persister",
        "@orpc/tanstack-query",
      ],
    },
  },
});
