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
        'Shown below the hero. Leave empty to auto-calculate from sold listings (properties sold + total sales volume).',
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
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Sold Page' }
    },
  },
})
