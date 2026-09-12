import { defineType, defineField } from 'sanity'

export const soldPage = defineType({
  name: 'soldPage',
  title: 'Sold Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Admin Title',
      type: 'string',
      description: 'Internal label only (not shown on the site).',
      initialValue: 'Sold Page',
    }),

    // Stats band — overrides the auto-calculated totals when set.
    defineField({
      name: 'stats',
      title: 'Stats Band',
      type: 'array',
      description:
        'Shown in the hero. Leave empty to auto-calculate from sold listings (properties sold + total sales volume).',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            { name: 'value', title: 'Value', type: 'string', description: 'e.g. "164" or "$341M"' },
            { name: 'label', title: 'Label', type: 'string', description: 'e.g. "Properties Sold"' },
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
      validation: (Rule) => Rule.max(4),
    }),

    // Running totals: a verified starting point plus every MLS sale closed after
    // it. This is what keeps "Properties Sold" and "Total Sales Volume" current
    // without anyone editing numbers by hand.
    defineField({
      name: 'baseline',
      title: 'Sales Totals Baseline',
      type: 'object',
      description:
        'The hero totals = these baseline figures + every MLS sale that closed AFTER the "as of" date. Set the baseline to your verified career totals as of that date; new closings then add themselves automatically. Sales closed on or before the date are assumed to be inside the baseline and are not double-counted. (The Stats Band above, if filled in, overrides this entirely.)',
      options: { collapsible: true, collapsed: false },
      fields: [
        {
          name: 'soldCount',
          title: 'Properties Sold (as of date)',
          type: 'number',
          validation: (Rule) => Rule.min(0).integer(),
        },
        {
          name: 'salesVolume',
          title: 'Total Sales Volume in dollars (as of date)',
          type: 'number',
          description: 'Whole dollars, no formatting — e.g. 451793276.',
          validation: (Rule) => Rule.min(0),
        },
        {
          name: 'asOf',
          title: 'Totals are correct through (date)',
          type: 'date',
          description: 'Inclusive. MLS sales dated after this day are added on top.',
        },
      ],
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
        'Rich-text SEO content below the hero (what makes the agent great at selling Aspen & Snowmass properties). Leave empty to use the built-in default copy.',
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
      return { title: title || 'Sold Page' }
    },
  },
})
