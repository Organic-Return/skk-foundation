import { describe, it, expect } from 'vitest';
import { listingSlug, listingPath, listingStreet, slugify, truncateSlug } from './listingUrl';

const ermine = {
  id: '20240515194235204886000000',
  mls_number: '193660',
  address: '45 Ermine Lane, Snowmass Village, CO 81615',
  city: 'Snowmass Village',
  state: 'CO',
  zip_code: '81615',
};

describe('listingSlug', () => {
  it('joins street, city, state and zip', () => {
    expect(listingSlug(ermine)).toBe('45-ermine-lane-snowmass-village-co-81615');
  });

  it('keeps unit numbers', () => {
    expect(
      listingSlug({ ...ermine, address: '130 Wood Road 614, Snowmass Village, CO 81615' })
    ).toBe('130-wood-road-614-snowmass-village-co-81615');
    expect(
      listingSlug({ ...ermine, address: '700 S Monarch Street Unit 108, Aspen, CO 81611', city: 'Aspen', zip_code: '81611' })
    ).toBe('700-s-monarch-street-unit-108-aspen-co-81611');
  });

  it('strips accents and punctuation, and spells out ampersands', () => {
    expect(
      listingSlug({ ...ermine, address: "12 Château Blvd. #4-B & Rue d'Été, Aspen, CO 81611", city: 'Aspen', zip_code: '81611' })
    ).toBe('12-chateau-blvd-4-b-and-rue-d-ete-aspen-co-81611');
  });

  it('uses the first unit of a multi-unit address', () => {
    expect(
      listingSlug({ ...ermine, address: '311 Main Street 101, 102, 201, Aspen, CO 81611', city: 'Aspen', zip_code: '81611' })
    ).toBe('311-main-street-101-aspen-co-81611');
  });

  it('cuts a very long address at a hyphen boundary within 80 characters', () => {
    const slug = listingSlug({
      ...ermine,
      address: '12345 Extraordinarily Long Mountain Ranch Access Road Parcel Seventeen Building C, Snowmass Village, CO 81615',
    });
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug).toBe('12345-extraordinarily-long-mountain-ranch-access-road-parcel-seventeen-building');
  });

  it('drops the street when the feed withholds the address', () => {
    expect(listingSlug({ ...ermine, address_display: false })).toBe('snowmass-village-co-81615');
  });

  it('falls back to city-state-zip when the address is missing or is only the city', () => {
    expect(listingSlug({ ...ermine, address: null })).toBe('snowmass-village-co-81615');
    expect(listingSlug({ ...ermine, address: '' })).toBe('snowmass-village-co-81615');
    expect(listingSlug({ ...ermine, address: 'Snowmass Village, CO 81615' })).toBe('snowmass-village-co-81615');
  });

  it('is empty when nothing is known', () => {
    expect(listingSlug({ id: 'x' })).toBe('');
  });
});

describe('listingPath', () => {
  it('builds /listings/{mls}/{slug}', () => {
    expect(listingPath(ermine)).toBe('/listings/193660/45-ermine-lane-snowmass-village-co-81615');
  });

  it('uses the database id when there is no MLS number', () => {
    expect(listingPath({ ...ermine, mls_number: null })).toBe(
      '/listings/20240515194235204886000000/45-ermine-lane-snowmass-village-co-81615'
    );
  });

  it('omits the slug segment when no slug can be built', () => {
    expect(listingPath({ id: '42' })).toBe('/listings/42');
  });

  it('encodes an id with unsafe characters', () => {
    expect(listingPath({ id: 'a b/c' })).toBe('/listings/a%20b%2Fc');
  });
});

describe('listingStreet', () => {
  it('returns the street without the city tail', () => {
    expect(listingStreet(ermine)).toBe('45 Ermine Lane');
  });
  it('returns null for a bare city address', () => {
    expect(listingStreet({ address: 'Aspen, CO 81611', city: 'Aspen' })).toBeNull();
  });
});

describe('slugify / truncateSlug', () => {
  it('collapses runs of separators and trims hyphens', () => {
    expect(slugify('  --Hello,   World!! ')).toBe('hello-world');
  });
  it('leaves short slugs alone', () => {
    expect(truncateSlug('abc-def', 10)).toBe('abc-def');
  });
  it('cuts at the last hyphen before the limit', () => {
    expect(truncateSlug('abc-defgh-ijk', 9)).toBe('abc-defgh');
    expect(truncateSlug('abc-defgh-ijk', 8)).toBe('abc');
  });
});
