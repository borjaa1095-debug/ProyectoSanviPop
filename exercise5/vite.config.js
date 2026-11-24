import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        login: "login.html",
        register: "register.html",
        addProduct: "add-product.html",
        productDetail: "product-detail.html",
        profile: "profile.html",
        ratings: "ratings.html",
      },
    },
  },
});