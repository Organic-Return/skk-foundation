'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

interface AnalyticsData {
  configured: boolean;
  period: string;
  metrics: {
    sessions: number;
    activeUsers: number;
    newUsers: number;
    pageViews: number;
    engagementRate: number;
    avgSessionDuration: number;
  };
  trafficSources: { source: string; medium: string; sessions: number }[];
  topPages: { path: string; pageViews: number }[];
}

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/dashboard/login');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/dashboard/login');
      } else {
        setToken(session.access_token);
      }
    });
  }, [router]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/dashboard/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push('/dashboard');
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to fetch analytics');
        return;
      }

      setData(json);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, period, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  };

  const formatNumber = (n: number) => n.toLocaleString();

  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Site Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Google Analytics overview</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Back to Leads
        </button>
      </div>

      {/* Not configured state */}
      {data && !data.configured && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Google Analytics Not Configured</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            To view analytics data, set up the following environment variables in your Vercel project:
          </p>
          <div className="text-left max-w-md mx-auto bg-gray-50 rounded-lg p-4 text-sm font-mono">
            <p className="mb-2"><span className="text-blue-600">GA_PROPERTY_ID</span>=<span className="text-gray-500">your-numeric-property-id</span></p>
            <p><span className="text-blue-600">GOOGLE_SERVICE_ACCOUNT_KEY</span>=<span className="text-gray-500">base64-encoded-service-account-json</span></p>
          </div>
          <div className="mt-6 text-left max-w-lg mx-auto text-sm text-gray-500 space-y-2">
            <p><strong>Step 1:</strong> Create a service account in Google Cloud Console</p>
            <p><strong>Step 2:</strong> Enable the Google Analytics Data API for your project</p>
            <p><strong>Step 3:</strong> Add the service account email as a Viewer on your GA4 property</p>
            <p><strong>Step 4:</strong> Download the JSON key, then base64-encode it:</p>
            <code className="block bg-gray-100 px-3 py-2 rounded mt-1">cat service-account-key.json | base64</code>
            <p><strong>Step 5:</strong> Set both env vars in Vercel and redeploy</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-400">Loading analytics...</div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Analytics data */}
      {data?.configured && !loading && (
        <>
          {/* Period selector */}
          <div className="flex gap-2 mb-6">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(data.metrics.sessions)}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(data.metrics.activeUsers)}</p>
              <p className="text-xs text-gray-400 mt-1">{formatNumber(data.metrics.newUsers)} new</p>
            </div>
            <div className="bg-white shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Page Views</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(data.metrics.pageViews)}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatPercent(data.metrics.engagementRate)}</p>
              <p className="text-xs text-gray-400 mt-1">Avg. {formatDuration(data.metrics.avgSessionDuration)}</p>
            </div>
          </div>

          {/* Two column layout for tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-medium text-gray-700">Traffic Sources</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source / Medium</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.trafficSources.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {s.source} <span className="text-gray-400">/ {s.medium}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatNumber(s.sessions)}</td>
                    </tr>
                  ))}
                  {data.trafficSources.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-4 text-sm text-gray-400 text-center">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Top Pages */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-medium text-gray-700">Top Pages</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topPages.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-[300px]">{p.path}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatNumber(p.pageViews)}</td>
                    </tr>
                  ))}
                  {data.topPages.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-4 text-sm text-gray-400 text-center">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
