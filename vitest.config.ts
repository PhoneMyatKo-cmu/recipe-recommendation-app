import { defineConfig } from "vitest/config";

// Test config is kept separate from vite.config.ts because Vite 8 (rolldown)
// and Vitest resolve different copies of Vite, whose plugin types conflict.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
