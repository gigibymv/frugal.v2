import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["react", "react-dom", "zustand"],
          "vendor-charts": ["recharts"],
          "vendor-supabase": [
            "@supabase/supabase-js",
            "@supabase/auth-js",
          ],
        },
      },
    },
  },
})
