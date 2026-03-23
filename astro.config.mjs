// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import markdoc from '@astrojs/markdoc';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  integrations: [
    tailwind(),
    markdoc(),
  ],
  output: 'server',
});
