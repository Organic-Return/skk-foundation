-- Create materialized view with only active listings (~3,000 rows vs 100K+)
-- Pre-computes COALESCE expressions so indexes work properly

CREATE MATERIALIZED VIEW IF NOT EXISTS active_listings AS
SELECT * FROM graphql_listings
WHERE status IN (
  'Active', 'Active Under Contract', 'Active U/C W/ Bump',
  'Pending', 'Pending Inspect/Feasib', 'To Be Built', 'Coming Soon'
);

-- Create a unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_listings_id
  ON active_listings (id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_active_listings_city
  ON active_listings (city);

CREATE INDEX IF NOT EXISTS idx_active_listings_status
  ON active_listings (status);

CREATE INDEX IF NOT EXISTS idx_active_listings_city_status
  ON active_listings (city, status);

CREATE INDEX IF NOT EXISTS idx_active_listings_listing_date
  ON active_listings (listing_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_active_listings_property_type
  ON active_listings (property_type);

CREATE INDEX IF NOT EXISTS idx_active_listings_list_price
  ON active_listings (list_price);

CREATE INDEX IF NOT EXISTS idx_active_listings_listing_id
  ON active_listings (listing_id);

-- Schedule automatic refresh every 15 minutes (requires pg_cron extension)
-- If pg_cron is not enabled, run: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then:
-- SELECT cron.schedule('refresh-active-listings', '*/15 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY active_listings'
-- );
