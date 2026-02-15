import { NextResponse } from 'next/server';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mls = searchParams.get('mls') || '285075';

  const configured = isRealogyConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      env: {
        REALOGY_SUPABASE_URL: !!process.env.REALOGY_SUPABASE_URL,
        REALOGY_SUPABASE_ANON_KEY: !!process.env.REALOGY_SUPABASE_ANON_KEY,
      },
      message: 'Realogy Supabase not configured — env vars missing',
    });
  }

  const client = getRealogySupabase();
  if (!client) {
    return NextResponse.json({ configured: true, client: false, message: 'Client creation failed' });
  }

  const { data, error } = await client
    .from('realogy_listings')
    .select('rfg_listing_id, mls_numbers, default_photo_url, media')
    .contains('mls_numbers', JSON.stringify([mls]))
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ configured: true, error: error.message });
  }

  if (!data) {
    return NextResponse.json({ configured: true, match: false, mls });
  }

  const media = Array.isArray(data.media) ? data.media : [];
  const images = media.filter((m: any) => m.format === 'Image');
  const videos = media.filter((m: any) => m.format === 'Video');
  const tours = media.filter((m: any) => m.format === '3D Video');

  return NextResponse.json({
    configured: true,
    match: true,
    mls,
    rfg_listing_id: data.rfg_listing_id,
    images: images.length,
    videos: videos.length,
    videoUrls: videos.map((v: any) => v.url),
    tours: tours.length,
    tourUrls: tours.map((t: any) => t.url),
  });
}
