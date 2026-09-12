/**
 * Appends a fourth accolade to Homepage > Accolades ("Performance Speaks
 * Volumes"): value 270, label "Transactions Completed". Goes after the
 * existing three (Top 10 for 10 / 97% / 58) so it lands last in the row.
 *
 *   SANITY_WRITE_TOKEN=<editor token> node scripts/add-accolade-transactions.mjs --dry-run
 *   SANITY_WRITE_TOKEN=<editor token> node scripts/add-accolade-transactions.mjs
 *
 * Idempotent: refuses to add a second copy if a 270 / Transactions item exists.
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

const ITEM = {
  _type: 'accolade',
  _key: 'accolade-transactions-270',
  type: 'number',
  value: '270',
  label: 'Transactions Completed',
}

async function main() {
  if (!process.env.SANITY_WRITE_TOKEN && !dryRun) {
    console.error('SANITY_WRITE_TOKEN is not set (Editor token from sanity.io/manage > API > Tokens).')
    process.exit(1)
  }
  console.log(`project ${projectId} / dataset ${dataset}${dryRun ? '  (dry run)' : ''}\n`)

  const items = (await client.fetch(`*[_type == "homepage" && _id == "homepage"][0].accolades.items`)) || []
  console.log(`current accolades (${items.length}):`)
  for (const it of items) console.log(`  ${(it.prefix || '') + it.value}  —  ${it.label}`)

  const dup = items.find(
    (it) => it._key === ITEM._key || (String(it.value) === ITEM.value && /transaction/i.test(it.label || ''))
  )
  if (dup) {
    console.log('\nAlready present — nothing to do.')
    return
  }
  if (items.length >= 4) {
    console.error(`\nThere are already ${items.length} items and the homepage renders at most 4.`)
    console.error('Remove one in Studio first, or raise the cap in ModernQuoteBlock (slice(0, 4) + grid-cols-4).')
    process.exit(1)
  }

  console.log(`\nWould append: ${ITEM.value}  —  ${ITEM.label}`)
  if (dryRun) return

  await client.patch('homepage').setIfMissing({ 'accolades.items': [] }).append('accolades.items', [ITEM]).commit()
  console.log('Done. The row now shows four items; no deploy needed.')
}

main().catch((e) => {
  console.error('\nFailed:', e.message)
  process.exit(1)
})
