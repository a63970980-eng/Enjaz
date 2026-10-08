import {defineConfig} from 'vite';
export default defineConfig({
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
