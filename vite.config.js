import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: true,
    host: true,
    hmr: false,
  },
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    environment: 'node',
  },
});
