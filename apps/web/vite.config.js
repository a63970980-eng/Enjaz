import {fileURLToPath, URL} from 'node:url';
import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url))
      }
    }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
});
