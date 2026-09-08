/**
 * Seeds Homepage > Client Video Testimonials Section with the five client
 * videos that are currently hardcoded as a fallback in HomepageContent.
 *
 * Once this runs, the section is CMS-managed: reorder, retitle, add
 * descriptions or swap videos in Studio without a deploy. The hardcoded list
 * only applies while the Sanity array is empty, so it goes dormant.
 *
 *   SANITY_WRITE_TOKEN=<editor token> node scripts/seed-client-videos.mjs --dry-run
 *   SANITY_WRITE_TOKEN=<editor token> node scripts/seed-client-videos.mjs
 *
 * Create the token at sanity.io/manage > API > Tokens with Editor permission.
 */
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'o7n6fhek'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const dryRun = process.argv.includes('--dry-run')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})

// Order here is the order they appear in the carousel. Descriptions are left
// empty on purpose — these are real clients, so the copy has to be written
// rather than invented. The paragraph renders only once a description exists.
const VIDEOS = [
  { assetId: '96c4bad7-4903-4115-8e93-821cdaae725e', name: 'Anne McGrath', description: '' },
  { assetId: '24a4fdd8-4b7d-4f30-89ce-3b303796b056', name: 'The Goodwins', description: '' },
  { assetId: '0706bf71-7921-4caf-a2b2-d02553359b8f', name: 'Michelle', description: '' },
  { assetId: '0b74ead1-0d42-488c-ba72-c94229d4b5ea', name: 'Danny', description: '' },
  { assetId: '1db50aae-b7f3-441f-921a-31d3df016e62', name: 'Amy', description: '' },
]

async function main() {
  if (!process.env.SANITY_WRITE_TOKEN && !dryRun) {
    console.error('SANITY_WRITE_TOKEN is not set. Create an Editor token at')
    console.error('sanity.io/manage > API > Tokens, then re-run:')
    console.error('  SANITY_WRITE_TOKEN=<token> node scripts/seed-client-videos.mjs')
    process.exit(1)
  }

  console.log(`project ${projectId} / dataset ${dataset}${dryRun ? '  (dry run)' : ''}\n`)

  // Confirm every referenced Mux asset still exists and is playable, so a bad
  // reference is caught here rather than as a blank card on the homepage.
  const assets = await client.fetch(
    `*[_type == "mux.videoAsset" && _id in $ids]{_id, filename, status}`,
    { ids: VIDEOS.map((v) => v.assetId) }
  )
  const byId = new Map(assets.map((a) => [a._id, a]))
  let bad = false
  for (const v of VIDEOS) {
    const a = byId.get(v.assetId)
    if (!a) {
      console.error(`  MISSING  ${v.name}  (${v.assetId})`)
      bad = true
    } else if (a.status !== 'ready') {
      console.error(`  NOT READY  ${v.name}  status=${a.status}`)
      bad = true
    } else {
      console.log(`  ok  ${v.name.padEnd(14)} -> ${a.filename}`)
    }
  }
  if (bad) {
    console.error('\nAborted: fix the assets above before seeding.')
    process.exit(1)
  }

  // Don't clobber content someone has already entered by hand.
  const existing = await client.fetch(
    `*[_type == "homepage" && _id == "homepage"][0].clientVideosSection.videos`
  )
  if (Array.isArray(existing) && existing.length > 0) {
    console.error(`\nHomepage already has ${existing.length} video(s) in this section.`)
    console.error('Refusing to overwrite. Clear them in Studio first if you want a reset.')
    process.exit(1)
  }

  const section = {
    enabled: true,
    title: 'In their words',
    videos: VIDEOS.map((v, i) => ({
      _type: 'clientVideo',
      _key: `clientVideo${i + 1}`,
      muxVideo: {
        _type: 'mux.video',
        asset: { _type: 'reference', _ref: v.assetId },
      },
      title: v.name,
      ...(v.description ? { description: v.description } : {}),
    })),
  }

  if (dryRun) {
    console.log('\nWould write clientVideosSection:\n')
    console.log(JSON.stringify(section, null, 2))
    return
  }

  await client.patch('homepage').set({ clientVideosSection: section }).commit()
  console.log(`\nWrote ${section.videos.length} videos to Homepage > Client Video Testimonials Section.`)
  console.log('The hardcoded fallback is now dormant; edit the section in Studio.')
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})
