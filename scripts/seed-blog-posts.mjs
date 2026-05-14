/**
 * Seed blog posts into Sanity from markdown files in scripts/blog-posts/.
 *
 * Each .md file has YAML-ish frontmatter (title, slug, meta_title,
 * meta_description, primary_keyword, secondary_keywords) followed by a
 * markdown body. The body is converted to Portable Text and the post is
 * upserted with a deterministic _id (post-<slug>) so re-runs are idempotent.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=sk... node scripts/seed-blog-posts.mjs
 */
import { createClient } from '@sanity/client';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, 'blog-posts');

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error(
    'Missing SANITY_WRITE_TOKEN.\n' +
      'Run: SANITY_WRITE_TOKEN=<your-token> node scripts/seed-blog-posts.mjs'
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1zb39xqr',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);

/** Split a line of text into Portable Text spans, honoring **bold**. */
function parseInline(text) {
  const spans = [];
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      spans.push({ _type: 'span', _key: key(), text: part.slice(2, -2), marks: ['strong'] });
    } else {
      spans.push({ _type: 'span', _key: key(), text: part, marks: [] });
    }
  }
  return spans.length ? spans : [{ _type: 'span', _key: key(), text, marks: [] }];
}

/** Convert a markdown string to a Portable Text block array. */
function markdownToPortableText(md) {
  const lines = md.split('\n');
  const blocks = [];
  let para = [];
  let skippedFirstH1 = false;

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').trim();
    if (text) {
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        markDefs: [],
        children: parseInline(text),
      });
    }
    para = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushPara();
      const level = heading[1].length;
      // The first H1 duplicates the title field — skip it.
      if (level === 1 && !skippedFirstH1) {
        skippedFirstH1 = true;
        continue;
      }
      const style = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      blocks.push({
        _type: 'block',
        _key: key(),
        style,
        markDefs: [],
        children: parseInline(heading[2].trim()),
      });
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      flushPara();
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        listItem: 'number',
        level: 1,
        markDefs: [],
        children: parseInline(numbered[1].trim()),
      });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushPara();
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs: [],
        children: parseInline(bullet[1].trim()),
      });
      continue;
    }

    para.push(trimmed);
  }
  flushPara();
  return blocks;
}

/** Parse simple `key: "value"` frontmatter; ignores nested array lines. */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split('\n')) {
    const fm = line.match(/^([a-z_]+):\s*(.*)$/);
    if (fm && fm[2].trim()) {
      let v = fm[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      data[fm[1]] = v;
    }
  }
  return { data, body: match[2] };
}

const files = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

if (!files.length) {
  console.error(`No .md files found in ${POSTS_DIR}`);
  process.exit(1);
}

const tx = client.transaction();
let queued = 0;

files.forEach((file, index) => {
  const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);

  if (!data.title || !data.slug) {
    console.warn(`Skipping ${file}: missing title or slug in frontmatter`);
    return;
  }

  const keywords = [
    data.primary_keyword,
    ...(data.secondary_keywords ? data.secondary_keywords.split(',') : []),
  ]
    .map((k) => k && k.trim())
    .filter(Boolean);

  const doc = {
    _type: 'post',
    _id: `post-${data.slug}`,
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    // Stagger timestamps so file order is preserved in date-sorted lists.
    publishedAt: new Date(Date.now() - index * 60_000).toISOString(),
    seo: {
      metaTitle: data.meta_title || data.title,
      metaDescription: data.meta_description || '',
      keywords,
      noIndex: false,
    },
    body: markdownToPortableText(body),
  };

  tx.createOrReplace(doc);
  queued++;
  console.log(`Queued: ${data.title}  (${doc._id})`);
});

if (!queued) {
  console.error('Nothing to commit.');
  process.exit(1);
}

const result = await tx.commit();
console.log(`\nDone. Upserted ${queued} posts in transaction ${result.transactionId}.`);
