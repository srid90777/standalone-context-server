import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  bundle: true,
  splitting: false,
  minify: false,
  sourcemap: true,
  clean: true,
  dts: true,
  treeshake: true,
  outDir: 'dist/lib',
});
