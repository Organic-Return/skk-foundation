import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { requireAdmin } from '@/lib/dashboard-auth';

function getAnalyticsClient(): BetaAnalyticsDataClient | null {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyBase64 || !process.env.GA_PROPERTY_ID) return null;

  const credentials = JSON.parse(
    Buffer.from(keyBase64, 'base64').toString('utf-8')
  );

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });
}

function periodToDays(period: string): string {
  switch (period) {
    case '7d': return '7daysAgo';
    case '90d': return '90daysAgo';
    default: return '30daysAgo';
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getAnalyticsClient();
  if (!client) {
    return NextResponse.json({ configured: false });
  }

  const period = request.nextUrl.searchParams.get('period') || '30d';
  const startDate = periodToDays(period);
  const property = `properties/${process.env.GA_PROPERTY_ID}`;

  try {
    const [summary, sources, pages] = await Promise.all([
      // 1. Summary metrics
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // 2. Traffic sources
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),

      // 3. Top pages
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
    ]);

    // Parse summary row
    const summaryRow = summary[0]?.rows?.[0];
    const metrics = {
      sessions: parseInt(summaryRow?.metricValues?.[0]?.value || '0'),
      activeUsers: parseInt(summaryRow?.metricValues?.[1]?.value || '0'),
      newUsers: parseInt(summaryRow?.metricValues?.[2]?.value || '0'),
      pageViews: parseInt(summaryRow?.metricValues?.[3]?.value || '0'),
      engagementRate: parseFloat(summaryRow?.metricValues?.[4]?.value || '0'),
      avgSessionDuration: parseFloat(summaryRow?.metricValues?.[5]?.value || '0'),
    };

    // Parse traffic sources
    const trafficSources = (sources[0]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || '(unknown)',
      medium: row.dimensionValues?.[1]?.value || '(unknown)',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    // Parse top pages
    const topPages = (pages[0]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    return NextResponse.json({
      configured: true,
      period,
      metrics,
      trafficSources,
      topPages,
    });
  } catch (err) {
    console.error('GA4 API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
