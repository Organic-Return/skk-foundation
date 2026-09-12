import { defineType, defineField } from 'sanity'

/**
 * A page for a membership or affiliation (e.g. "The Council"), served at
 * /about/<slug>. Created so the footer's affiliation logos have somewhere to
 * link without a new code route per affiliation.
 */
export const affiliationPage = defineType({
  name: 'affiliationPage',
  title: 'Affiliation Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The page lives at /about/<slug>.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'heroEyebrow', title: 'Hero Eyebrow', type: 'string', description: 'Small label above the title, e.g. "Affiliation".' }),
    defineField({ name: 'heroTitle', title: 'Hero Title', type: 'string', description: 'Defaults to the Title.' }),
    defineField({ name: 'heroSubtitle', title: 'Hero Subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'heroImage', title: 'Hero Background Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'logo',
      title: 'Affiliation Logo',
      type: 'image',
      description: 'Shown large on a dark band below the hero. White-on-transparent artwork works best.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      description: 'The page copy. Nothing renders here until it is written — no placeholder text.',
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
              { name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'url', title: 'URL' }] },
            ],
          },
        },
      ],
    }),
    defineField({ name: 'ctaHeading', title: 'CTA Heading', type: 'string', description: 'Leave empty to omit the closing call-to-action band.' }),
    defineField({ name: 'ctaSubtitle', title: 'CTA Subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'ctaButtonText', title: 'CTA Button Text', type: 'string' }),
    defineField({ name: 'ctaButtonLink', title: 'CTA Button Link', type: 'string' }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 },
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current', media: 'logo' } },
})
