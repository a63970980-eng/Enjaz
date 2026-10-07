import {defineConfig} from 'vite';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        landing: fileURLToPath(new URL('./landing.html', import.meta.url))
      }
    }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true
  }
});
