import { defineType, defineField } from 'sanity'

export const accolade = defineType({
  name: 'accolade',
  title: 'Accolade',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Display Type',
      type: 'string',
      options: {
        list: [
          { title: 'Number', value: 'number' },
          { title: 'Number with Prefix', value: 'numberWithPrefix' },
          { title: 'Image', value: 'image' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The main display value (number or text)',
      hidden: ({ parent }) => parent?.type === 'image',
    }),
    defineField({
      name: 'liveValue',
      title: 'Live Value',
      type: 'string',
      description:
        'Replace the Value above with a live figure from the Sold Page baseline plus new MLS closings, so it matches /sold, /buy and /sell automatically.',
      options: {
        list: [
          { title: 'None (use Value)', value: 'none' },
          { title: 'Properties sold (career count)', value: 'soldCount' },
          { title: 'Total sales volume', value: 'salesVolume' },
        ],
      },
      initialValue: 'none',
      hidden: ({ parent }) => parent?.type === 'image',
    }),
    defineField({
      name: 'prefix',
      title: 'Prefix',
      type: 'string',
      description: 'Optional prefix (e.g., #, $)',
      hidden: ({ parent }) => parent?.type !== 'numberWithPrefix',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Display image instead of number',
      hidden: ({ parent }) => parent?.type !== 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'text',
      rows: 2,
      description: 'Description text below the value/image',
    }),
  ],
  preview: {
    select: {
      type: 'type',
      value: 'value',
      prefix: 'prefix',
      label: 'label',
      image: 'image',
    },
    prepare(selection) {
      const { type, value, prefix, label, image } = selection;
      let title = '';

      if (type === 'image') {
        title = 'Image';
      } else if (type === 'numberWithPrefix') {
        title = `${prefix || ''}${value || ''}`;
      } else {
        title = value || 'Accolade';
      }

      return {
        title,
        subtitle: label || 'No label',
        media: image,
      };
    },
  },
})
