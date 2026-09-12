import { defineType, defineField } from 'sanity'

export const affiliatedPartnersPage = defineType({
  name: 'affiliatedPartnersPage',
  title: 'Affiliated Partners Page',
  type: 'document',
  fields: [
    defineField({
      name: 'pageType',
      title: 'Page Type',
      type: 'string',
      options: {
        list: [
          { title: 'The Council', value: 'the_council' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main heading for the page hero section',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      description: 'Subheading text below the title',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      description: 'Optional background image for the hero section',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'logo',
      title: 'Section Logo',
      type: 'image',
      description: 'Optional logo displayed in the hero section',
      options: {
        hotspot: true,
      },
    }),

    // Category Cards (only for main page)
    defineField({
      name: 'introTitle',
      title: 'Intro Section Title',
      type: 'string',
      description: 'Optional section between the hero and the member grid (used on The Council page).',
    }),
    defineField({
      name: 'introText',
      title: 'Intro Section Text',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'introImage',
      title: 'Intro Section Image',
      type: 'image',
      options: { hotspot: true },
    }),

    // Featured Section (only for main page)
    defineField({
      name: 'featuredSectionTitle',
      title: 'Featured Section Title',
      type: 'string',
      hidden: ({ parent }) => parent?.pageType !== 'main',
      description: 'Title for the featured partners section',
    }),

    // CTA Section
    defineField({
      name: 'ctaTitle',
      title: 'CTA Section Title',
      type: 'string',
      description: 'Heading for the call-to-action section at the bottom',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'CTA Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ctaButtonText',
      title: 'CTA Button Text',
      type: 'string',
    }),
    defineField({
      name: 'ctaButtonAction',
      title: 'CTA Button Action',
      type: 'string',
      options: {
        list: [
          { title: 'Link to Page', value: 'link' },
          { title: 'Open Contact Modal', value: 'contact_modal' },
        ],
        layout: 'radio',
      },
      initialValue: 'link',
      description: 'Choose whether the button links to a page or opens the contact modal',
    }),
    defineField({
      name: 'ctaButtonLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'URL or path for the CTA button (only used if "Link to Page" is selected)',
      hidden: ({ parent }) => parent?.ctaButtonAction === 'contact_modal',
    }),

  ],
  preview: {
    select: {
      pageType: 'pageType',
      title: 'heroTitle',
    },
    prepare({ pageType, title }) {
      const typeLabels: Record<string, string> = {
        main: 'Main Landing Page',
        ski_town: 'Ski Town Partners',
        market_leaders: 'Market Leaders',
      }
      return {
        title: typeLabels[pageType] || pageType,
        subtitle: title || 'No title set',
      }
    },
  },
})
