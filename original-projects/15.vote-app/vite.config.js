import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // `npm run dev:vite` 로 HMR을 쓸 때, API는 옆에서 돌고 있는 `wrangler dev`로 넘긴다.
    // 같은 오리진처럼 보이므로 CORS 설정이 필요 없다.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
});
