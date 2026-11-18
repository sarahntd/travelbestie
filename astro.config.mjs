import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://travelbestie.site',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
