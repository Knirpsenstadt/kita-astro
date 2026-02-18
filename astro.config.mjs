// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

const includeKeystatic = process.argv.includes('dev');

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    markdoc(),
    ...(includeKeystatic ? [keystatic()] : []),
  ],
  output: 'static',
});
