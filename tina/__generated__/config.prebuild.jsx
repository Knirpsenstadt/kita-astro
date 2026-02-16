// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
var config_default = defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "pages",
        label: "Seiten",
        path: "src/content/pages",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titel", isTitle: true, required: true },
          { type: "string", name: "permalink", label: "Link" },
          { type: "boolean", name: "showBadge", label: "Badge anzeigen" },
          { type: "number", name: "menuOrder", label: "Men\xFC-Reihenfolge" },
          { type: "rich-text", name: "body", label: "Inhalt", isBody: true }
        ]
      },
      {
        name: "events",
        label: "Kalender-Eintr\xE4ge",
        path: "src/content/events",
        format: "md",
        fields: [
          { type: "string", name: "label", label: "Titel", isTitle: true, required: true },
          {
            type: "string",
            name: "type",
            label: "Typ",
            options: [
              { label: "Termin", value: "event" },
              { label: "Schlie\xDFzeit", value: "closure" },
              { label: "Fest", value: "festivity" }
            ]
          },
          { type: "datetime", name: "start", label: "Start", required: true },
          { type: "datetime", name: "end", label: "Ende" }
        ]
      },
      {
        name: "sponsors",
        label: "Sponsoren",
        path: "src/content/sponsors",
        format: "md",
        fields: [
          { type: "string", name: "name", label: "Name", isTitle: true, required: true },
          { type: "image", name: "logo", label: "Logo" },
          { type: "string", name: "website", label: "Website" },
          { type: "string", name: "description", label: "Beschreibung", ui: { component: "textarea" } },
          { type: "string", name: "support", label: "Unterst\xFCtzung", ui: { component: "textarea" } }
        ]
      },
      {
        name: "home",
        label: "Startseite",
        path: "src/content/home",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Titel" },
          { type: "rich-text", name: "body", label: "Inhalt", isBody: true }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
