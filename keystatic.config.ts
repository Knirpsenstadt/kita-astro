import { collection, config, fields, singleton } from '@keystatic/core'

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    pages: collection({
      label: 'Seiten',
      slugField: 'slug',
      path: 'src/keystatic/pages/*',
      format: { contentField: 'body' },
      columns: ['title', 'permalink', 'menuOrder'],
      schema: {
        slug: fields.text({ label: 'Slug', validation: { isRequired: true } }),
        title: fields.text({ label: 'Titel', validation: { isRequired: true } }),
        permalink: fields.text({ label: 'Link', description: 'z.B. /team/' }),
        showBadge: fields.checkbox({ label: 'Badge anzeigen', defaultValue: false }),
        menuOrder: fields.integer({ label: 'Menue-Reihenfolge', defaultValue: 999 }),
        blocks: fields.ignored(),
        body: fields.markdoc({
          label: 'Seiteninhalt',
          options: {
            heading: [2, 3],
            image: {
              directory: 'public/uploads',
              publicPath: '/uploads/',
            },
          },
        }),
      },
    }),
    events: collection({
      label: 'Kalender-Eintraege',
      slugField: 'slug',
      path: 'src/keystatic/events/*',
      format: { contentField: 'content' },
      columns: ['label', 'type', 'start'],
      schema: {
        slug: fields.text({ label: 'Slug', validation: { isRequired: true } }),
        label: fields.text({ label: 'Titel', validation: { isRequired: true } }),
        type: fields.select({
          label: 'Typ',
          defaultValue: 'event',
          options: [
            { label: 'Termin', value: 'event' },
            { label: 'Schliesszeit', value: 'closure' },
            { label: 'Fest', value: 'festivity' },
          ],
        }),
        start: fields.date({ label: 'Start', validation: { isRequired: true } }),
        end: fields.date({ label: 'Ende' }),
        content: fields.markdoc({ label: 'Notizen' }),
      },
    }),
    sponsors: collection({
      label: 'Sponsoren',
      slugField: 'slug',
      path: 'src/keystatic/sponsors/*',
      format: { contentField: 'content' },
      columns: ['name', 'website'],
      schema: {
        slug: fields.text({ label: 'Slug', validation: { isRequired: true } }),
        name: fields.text({ label: 'Name', validation: { isRequired: true } }),
        logo: fields.text({ label: 'Logo (Pfad oder URL)' }),
        website: fields.url({ label: 'Website' }),
        description: fields.text({ label: 'Beschreibung', multiline: true }),
        support: fields.text({ label: 'Unterstuetzung', multiline: true }),
        content: fields.markdoc({ label: 'Notizen' }),
      },
    }),
  },
  singletons: {
    home: singleton({
      label: 'Startseite',
      path: 'src/keystatic/home/index',
      format: { contentField: 'body' },
      schema: {
        title: fields.text({ label: 'Titel' }),
        body: fields.markdoc({
          label: 'Inhalt',
          options: {
            heading: [2, 3],
            image: {
              directory: 'public/uploads',
              publicPath: '/uploads/',
            },
          },
        }),
      },
    }),
  },
})
