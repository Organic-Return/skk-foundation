import { defineType, defineField } from 'sanity'

export const christiesMastersCircle = defineType({
  name: 'christiesMastersCircle',
  title: "Christie's & Masters Circle Page",
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Admin Title',
      type: 'string',
      description: 'Internal label only (not shown on the site).',
      initialValue: "Christie's & Masters Circle",
    }),

    // Hero
    defineField({ name: 'heroEyebrow', title: 'Hero Eyebrow', type: 'string' }),
    defineField({ name: 'heroTitle', title: 'Hero Title', type: 'string' }),
    defineField({ name: 'heroSubtitle', title: 'Hero Subtitle', type: 'text', rows: 4 }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
    }),

    // Intro
    defineField({ name: 'introHeading', title: 'Intro Heading', type: 'string' }),
    defineField({
      name: 'introParagraphs',
      title: 'Intro Paragraphs',
      type: 'array',
      of: [{ type: 'object', name: 'paragraph', fields: [{ name: 'text', title: 'Text', type: 'text', rows: 4 }], preview: { select: { title: 'text' } } }],
    }),

    // Masters Circle
    defineField({ name: 'mastersCircleHeading', title: 'Masters Circle Heading', type: 'string' }),
    defineField({
      name: 'mastersCircleParagraphs',
      title: 'Masters Circle Paragraphs',
      type: 'array',
      of: [{ type: 'object', name: 'paragraph', fields: [{ name: 'text', title: 'Text', type: 'text', rows: 4 }], preview: { select: { title: 'text' } } }],
    }),

    // Distinctions (how it sets her apart)
    defineField({ name: 'distinctionsHeading', title: 'Distinctions Heading', type: 'string' }),
    defineField({
      name: 'distinctions',
      title: 'Distinctions',
      type: 'array',
      of: [{
        type: 'object',
        name: 'distinction',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text', rows: 3 },
        ],
        preview: { select: { title: 'title', subtitle: 'description' } },
      }],
    }),

    // Christie's + SKK benefits
    defineField({ name: 'christieHeading', title: "Christie's Benefits Heading", type: 'string' }),
    defineField({ name: 'christieIntro', title: "Christie's Benefits Intro", type: 'text', rows: 3 }),
    defineField({
      name: 'christieBenefits',
      title: "Christie's Benefits",
      type: 'array',
      of: [{
        type: 'object',
        name: 'benefit',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text', rows: 3 },
        ],
        preview: { select: { title: 'title', subtitle: 'description' } },
      }],
    }),

    // Stats band
    defineField({
      name: 'stats',
      title: 'Stats Band',
      type: 'array',
      of: [{
        type: 'object',
        name: 'stat',
        fields: [
          { name: 'value', title: 'Value', type: 'string' },
          { name: 'label', title: 'Label', type: 'string' },
        ],
        preview: { select: { title: 'value', subtitle: 'label' } },
      }],
      validation: (Rule) => Rule.max(4),
    }),

    // CTA
    defineField({ name: 'ctaHeading', title: 'CTA Heading', type: 'string' }),
    defineField({ name: 'ctaSubtitle', title: 'CTA Subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'ctaButtonText', title: 'CTA Button Text', type: 'string' }),
    defineField({ name: 'ctaButtonLink', title: 'CTA Button Link', type: 'string' }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 },
        { name: 'ogImage', title: 'Social Share Image', type: 'image' },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return { title: title || "Christie's & Masters Circle" }
    },
  },
})
