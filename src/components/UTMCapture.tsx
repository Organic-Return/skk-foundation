'use client';

import { useEffect } from 'react';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const STORAGE_KEY = 'lead_utm_data';

/**
 * Captures UTM parameters from the URL on first page load
 * and stores them in sessionStorage so they persist across navigations.
 */
export default function UTMCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = UTM_KEYS.some(key => params.has(key));

    if (hasUtm) {
      const data: Record<string, string> = {};
      for (const key of UTM_KEYS) {
        const val = params.get(key);
        if (val) data[key] = val;
      }
      // Also capture referrer and landing page
      data.source_url = window.location.href;
      if (document.referrer) data.referrer = document.referrer;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else if (!sessionStorage.getItem(STORAGE_KEY)) {
      // No UTM params and no existing data — store referrer + landing page only
      const data: Record<string, string> = {
        source_url: window.location.href,
      };
      if (document.referrer) data.referrer = document.referrer;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, []);

  return null;
}

/**
 * Get stored UTM data + source info for form submissions.
 * Call this from any form component before submitting.
 */
export function getUTMData(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    // Always include current page URL as source_url (overrides landing page)
    data.source_url = window.location.href;
    return data;
  } catch {
    return { source_url: window.location.href };
  }
}
