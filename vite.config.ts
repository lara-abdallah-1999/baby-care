import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ["src/tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    css: false,
  },
});
