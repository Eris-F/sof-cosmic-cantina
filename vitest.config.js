import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/infra/**', 'src/main.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@config': '/src/config',
      '@systems': '/src/systems',
      '@state': '/src/state',
      '@render': '/src/render',
      '@input': '/src/input',
      '@audio': '/src/audio',
      '@storage': '/src/storage',
      '@scenes': '/src/scenes',
      '@schemas': '/src/schemas',
    },
  },
});
