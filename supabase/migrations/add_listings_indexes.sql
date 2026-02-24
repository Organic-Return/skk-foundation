-- Add indexes to "rc-listings" table (base table for graphql_listings view)
-- Plain column indexes — PostgreSQL can use these when filtering through the view

-- Status columns (view uses COALESCE across these)
CREATE INDEX IF NOT EXISTS idx_rc_listings_standard_status
  ON "rc-listings" ("StandardStatus");

CREATE INDEX IF NOT EXISTS idx_rc_listings_mls_status
  ON "rc-listings" ("MlsStatus");

-- City filtering (direct column, no COALESCE)
CREATE INDEX IF NOT EXISTS idx_rc_listings_city
  ON "rc-listings" ("City");

-- Composite: city + standard status
CREATE INDEX IF NOT EXISTS idx_rc_listings_city_status
  ON "rc-listings" ("City", "StandardStatus");

-- Property type (direct column)
CREATE INDEX IF NOT EXISTS idx_rc_listings_property_type
  ON "rc-listings" ("PropertyType");

-- List price
CREATE INDEX IF NOT EXISTS idx_rc_listings_list_price
  ON "rc-listings" ("ListPrice");

-- Listing date for sort
CREATE INDEX IF NOT EXISTS idx_rc_listings_listing_date
  ON "rc-listings" ("ListingContractDate" DESC);

-- Listing ID lookups (detail page)
CREATE INDEX IF NOT EXISTS idx_rc_listings_listing_id
  ON "rc-listings" ("ListingId");
