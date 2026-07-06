import { defineType, defineField } from 'sanity'

export const exclusiveListingsPage = defineType({
  name: 'exclusiveListingsPage',
  title: 'Exclusive Listings Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Admin Title',
      type: 'string',
      description: 'Internal label only (not shown on the site).',
      initialValue: 'Exclusive Listings Page',
    }),

    // SEO content section — rendered below the hero.
    defineField({
      name: 'contentHeading',
      title: 'Content Heading',
      type: 'string',
      description:
        'Heading for the SEO content section below the hero. Leave empty to use the default.',
    }),
    defineField({
      name: 'contentBody',
      title: 'Content Body',
      type: 'array',
      description:
        'Rich-text SEO content below the hero (about the properties currently for sale). Leave empty to use the built-in default copy.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [{ title: 'Bullet', value: 'bullet' }],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{ name: 'href', type: 'url', title: 'URL' }],
              },
            ],
          },
        },
      ],
    }),

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
      return { title: title || 'Exclusive Listings Page' }
    },
  },
})
