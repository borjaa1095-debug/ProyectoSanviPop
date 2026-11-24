import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: ["index", "login", "register", "profile", "add-product", "product-detail", "ratings"]
        .map(page => page + ".html"),
    },
  },
});
