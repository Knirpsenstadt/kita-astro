import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    permalink: z.string().optional(),
    showBadge: z.boolean().optional(),
    menuOrder: z.number().optional(),
    blocks: z.array(z.object({ _template: z.string() }).passthrough()).optional(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/events' }),
  schema: z.object({
    label: z.string(),
    type: z.enum(['event', 'closure', 'festivity']).default('event'),
    start: z.coerce.string(),
    end: z.coerce.string().optional(),
  }),
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/sponsors' }),
  schema: z.object({
    name: z.string(),
    logo: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    support: z.string().optional(),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/home' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = { pages, events, sponsors, home };
