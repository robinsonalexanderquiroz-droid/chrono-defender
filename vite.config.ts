import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Use "/" for local dev; "/chrono-defender/" for production (GitHub Pages).
  const defaultBase = mode === 'production' ? '/chrono-defender/' : '/';

  return {
    base: env.VITE_BASE_PATH || defaultBase,

    build: {
      target: 'ES2022',
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true,
    },
  };
});
