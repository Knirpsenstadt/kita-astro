import { defineConfig } from 'tinacms'
import { IconPicker } from './components/IconPicker'
import { ICON_OPTIONS } from '../src/lib/iconOptions'

const branch = process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main'

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  

  
  schema: {
    collections: [
      {
        name: 'pages',
        label: 'Seiten',
        path: 'src/content/pages',
        format: 'md',
        fields: [
          { type: 'string', name: 'title', label: 'Titel', isTitle: true, required: true },
          { type: 'string', name: 'permalink', label: 'Link' },
          { type: 'boolean', name: 'showBadge', label: 'Badge anzeigen' },
          { type: 'number', name: 'menuOrder', label: 'Menü-Reihenfolge' },
          {
            type: 'rich-text',
            name: 'body',
            label: 'Seiteninhalt (einfacher Editor)',
            isBody: true,
          },
          {
            type: 'object',
            name: 'blocks',
            label: 'Inhaltsbloecke (erweitert)',
            list: true,
            templates: [
              {
                name: 'heading',
                label: 'Ueberschrift',
                fields: [
                  {
                    type: 'string',
                    name: 'level',
                    label: 'Ebene',
                    options: [
                      { label: 'H2', value: 'h2' },
                      { label: 'H3', value: 'h3' },
                    ],
                  },
                  { type: 'string', name: 'headingText', label: 'Text', required: true },
                ],
              },
              {
                name: 'paragraph',
                label: 'Absatz',
                fields: [
                  { type: 'string', name: 'bodyText', label: 'Text', required: true, ui: { component: 'textarea' } },
                ],
              },
              {
                name: 'highlightBox',
                label: 'Highlight Box',
                fields: [
                  { type: 'string', name: 'highlightText', label: 'Text', required: true, ui: { component: 'textarea' } },
                ],
              },
              {
                name: 'featureGrid',
                label: 'Feature Karten',
                fields: [
                  {
                    type: 'object',
                    name: 'cards',
                    label: 'Karten',
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({ label: item?.title || 'Karte' }),
                    },
                    fields: [
                      { type: 'string', name: 'title', label: 'Titel', required: true },
                      { type: 'string', name: 'description', label: 'Beschreibung', required: true, ui: { component: 'textarea' } },
                      {
                        type: 'string',
                        name: 'icon',
                        label: 'Icon',
                        required: true,
                        options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                        ui: { component: IconPicker },
                      },
                      { type: 'string', name: 'href', label: 'Link (optional)' },
                    ],
                  },
                ],
              },
              {
                name: 'educationGrid',
                label: 'Bildungsbereiche',
                fields: [
                  {
                    type: 'object',
                    name: 'areas',
                    label: 'Bereiche',
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({ label: item?.label || 'Bereich' }),
                    },
                    fields: [
                      { type: 'string', name: 'label', label: 'Bezeichnung', required: true },
                      {
                        type: 'string',
                        name: 'icon',
                        label: 'Icon',
                        required: true,
                        options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                        ui: { component: IconPicker },
                      },
                    ],
                  },
                ],
              },
              {
                name: 'iconList',
                label: 'Icon Liste',
                fields: [
                  {
                    type: 'object',
                    name: 'entries',
                    label: 'Eintraege',
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({ label: item?.entryText || 'Eintrag' }),
                    },
                    fields: [
                      { type: 'string', name: 'entryText', label: 'Text', required: true },
                      {
                        type: 'string',
                        name: 'icon',
                        label: 'Icon',
                        required: true,
                        options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                        ui: { component: IconPicker },
                      },
                    ],
                  },
                ],
              },
              {
                name: 'twoColumns',
                label: 'Zwei Spalten',
                fields: [
                  {
                    type: 'object',
                    name: 'columns',
                    label: 'Spalten',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Titel', required: true },
                      { type: 'string', name: 'bulletItems', label: 'Listenpunkte', list: true },
                    ],
                  },
                ],
              },
              {
                name: 'infoBox',
                label: 'Info Box',
                fields: [
                  { type: 'string', name: 'title', label: 'Titel', required: true },
                  {
                    type: 'string',
                    name: 'icon',
                    label: 'Icon',
                    required: true,
                    options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                    ui: { component: IconPicker },
                  },
                  { type: 'string', name: 'infoText', label: 'Text', ui: { component: 'textarea' } },
                  { type: 'string', name: 'bulletItems', label: 'Listenpunkte', list: true },
                ],
              },
              {
                name: 'docGrid',
                label: 'Dokumente Grid',
                fields: [
                  {
                    type: 'object',
                    name: 'documents',
                    label: 'Dokumente',
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({ label: item?.title || 'Dokument' }),
                    },
                    fields: [
                      { type: 'string', name: 'title', label: 'Titel', required: true },
                      { type: 'string', name: 'description', label: 'Beschreibung', ui: { component: 'textarea' } },
                      { type: 'string', name: 'href', label: 'Datei-Link', required: true },
                      {
                        type: 'string',
                        name: 'icon',
                        label: 'Icon',
                        required: true,
                        options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                        ui: { component: IconPicker },
                      },
                      { type: 'string', name: 'badge', label: 'Badge', options: ['PDF', 'LINK'] },
                    ],
                  },
                ],
              },
              {
                name: 'badge',
                label: 'Gruenes Badge',
                fields: [{ type: 'string', name: 'badgeText', label: 'Text', required: true }],
              },
              {
                name: 'separator',
                label: 'Trennlinie',
                fields: [
                  {
                    type: 'string',
                    name: 'variant',
                    label: 'Variante',
                    options: [{ label: 'Linie', value: 'line' }],
                    required: true,
                  },
                ],
              },
              {
                name: 'centerNotice',
                label: 'Zentrierter Hinweis',
                fields: [
                  {
                    type: 'string',
                    name: 'icon',
                    label: 'Icon',
                    required: true,
                    options: ICON_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
                    ui: { component: IconPicker },
                  },
                  { type: 'string', name: 'headline', label: 'Haupttext', required: true },
                  { type: 'string', name: 'subline', label: 'Untertext', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'events',
        label: 'Kalender-Einträge',
        path: 'src/content/events',
        format: 'md',
        fields: [
          { type: 'string', name: 'label', label: 'Titel', isTitle: true, required: true },
          { 
            type: 'string', 
            name: 'type', 
            label: 'Typ',
            options: [
              { label: 'Termin', value: 'event' },
              { label: 'Schließzeit', value: 'closure' },
              { label: 'Fest', value: 'festivity' },
            ],
          },
          { type: 'datetime', name: 'start', label: 'Start', required: true },
          { type: 'datetime', name: 'end', label: 'Ende' },
        ],
      },
      {
        name: 'sponsors',
        label: 'Sponsoren',
        path: 'src/content/sponsors',
        format: 'md',
        fields: [
          { type: 'string', name: 'name', label: 'Name', isTitle: true, required: true },
          { type: 'image', name: 'logo', label: 'Logo' },
          { type: 'string', name: 'website', label: 'Website' },
          { type: 'string', name: 'description', label: 'Beschreibung', ui: { component: 'textarea' } },
          { type: 'string', name: 'support', label: 'Unterstützung', ui: { component: 'textarea' } },
        ],
      },
      {
        name: 'home',
        label: 'Startseite',
        path: 'src/content/home',
        format: 'md',
        fields: [
          { type: 'string', name: 'title', label: 'Titel' },
          { type: 'rich-text', name: 'body', label: 'Inhalt', isBody: true },
        ],
      },
    ],
  },
})
