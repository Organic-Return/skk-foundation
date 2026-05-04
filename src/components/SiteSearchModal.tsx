'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface PropertyHit {
  id: string;
  mlsNumber?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  href: string;
  photo?: string | null;
}

interface NamedHit {
  title?: string;
  name?: string;
  excerpt?: string;
  href: string;
}

interface SearchResults {
  query: string;
  properties: PropertyHit[];
  communities: NamedHit[];
  posts: NamedHit[];
  pages: NamedHit[];
  team: NamedHit[];
}

interface SiteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_RESULTS: SearchResults = {
  query: '',
  properties: [],
  communities: [],
  posts: [],
  pages: [],
  team: [],
};

function formatPrice(price?: number | null) {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function SiteSearchModal({ isOpen, onClose }: SiteSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults(EMPTY_RESULTS);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/site-search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search failed');
        const data: SearchResults = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults(EMPTY_RESULTS);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.properties.length +
    results.communities.length +
    results.posts.length +
    results.pages.length +
    results.team.length;
  const hasQuery = query.trim().length >= 2;
  const showEmpty = hasQuery && !isLoading && totalResults === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-24 pb-10 bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MLS #, address, or keywords"
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none border-0"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!hasQuery && (
            <div className="px-5 py-10 text-sm text-gray-500">
              Search for properties by MLS number or address, or look up communities, blog posts, team members, and pages.
            </div>
          )}

          {isLoading && hasQuery && (
            <div className="px-5 py-6 text-sm text-gray-500">Searching…</div>
          )}

          {showEmpty && (
            <div className="px-5 py-10 text-sm text-gray-500">
              No results for &ldquo;{query}&rdquo;.
            </div>
          )}

          {!isLoading && hasQuery && totalResults > 0 && (
            <div className="divide-y divide-gray-100">
              {results.properties.length > 0 && (
                <Section title="Properties">
                  {results.properties.map((p) => (
                    <Link
                      key={p.id}
                      href={p.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900 truncate">
                          {p.address || `MLS #${p.mlsNumber}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {[p.city, p.state].filter(Boolean).join(', ')}
                          {p.mlsNumber ? ` · MLS ${p.mlsNumber}` : ''}
                        </div>
                      </div>
                      {formatPrice(p.price) && (
                        <div className="text-sm text-gray-700 flex-shrink-0">{formatPrice(p.price)}</div>
                      )}
                    </Link>
                  ))}
                </Section>
              )}

              {results.communities.length > 0 && (
                <Section title="Communities">
                  {results.communities.map((c) => (
                    <SimpleRow key={c.href} href={c.href} title={c.title || ''} onClick={onClose} />
                  ))}
                </Section>
              )}

              {results.team.length > 0 && (
                <Section title="Team">
                  {results.team.map((t) => (
                    <SimpleRow key={t.href} href={t.href} title={t.name || ''} onClick={onClose} />
                  ))}
                </Section>
              )}

              {results.posts.length > 0 && (
                <Section title="Blog">
                  {results.posts.map((p) => (
                    <SimpleRow key={p.href} href={p.href} title={p.title || ''} subtitle={p.excerpt} onClick={onClose} />
                  ))}
                </Section>
              )}

              {results.pages.length > 0 && (
                <Section title="Pages">
                  {results.pages.map((p) => (
                    <SimpleRow key={p.href} href={p.href} title={p.title || ''} onClick={onClose} />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-5 pt-4 pb-2 text-[11px] uppercase tracking-[0.18em] text-gray-400 font-medium">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SimpleRow({
  href,
  title,
  subtitle,
  onClick,
}: {
  href: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="block px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="text-sm text-gray-900 truncate">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
    </Link>
  );
}
