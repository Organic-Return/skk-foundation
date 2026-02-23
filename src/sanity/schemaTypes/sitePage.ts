import { defineType, defineField } from 'sanity'

export const sitePage = defineType({
  name: 'sitePage',
  title: 'Site Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroImageUrl',
      title: 'Hero Background Image URL',
      type: 'string',
      description: 'External URL for the hero background image',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Upload a hero image (overrides URL if both set)',
    }),
    defineField({
      name: 'contentHtml',
      title: 'Content (HTML)',
      type: 'text',
      rows: 20,
      description: 'Rich HTML content for the page body',
    }),
    defineField({
      name: 'embedUrl',
      title: 'Embed URL',
      type: 'url',
      description: 'URL for an embedded iframe (e.g., digital publication)',
    }),
    defineField({
      name: 'showContactForm',
      title: 'Show Contact Form',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
    },
  },
})
