'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ModernHeroProps {
  videoUrl?: string;
  fallbackImageUrl?: string;
  title?: string;
  subtitle?: string;
}

interface SuggestedProperty {
  id: string;
  mlsNumber: string;
  street: string;
  city: string;
  state: string;
}

interface Suggestions {
  areas: string[];
  properties: SuggestedProperty[];
}

const EMPTY: Suggestions = { areas: [], properties: [] };

export default function ModernHero({
  videoUrl,
  fallbackImageUrl,
  title = 'Exceptional Properties',
  subtitle = 'Discover a curated collection of the world\'s finest residences',
}: ModernHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggest, setSuggest] = useState<Suggestions>(EMPTY);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Type-ahead: matching areas plus a few active listings whose address,
  // town or MLS number contains the term. Debounced, and stale requests are
  // aborted so a fast typist never sees results for an earlier keystroke.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggest(EMPTY);
      setActiveIndex(-1);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/listings/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as Partial<Suggestions>;
          setSuggest({ areas: data.areas || [], properties: data.properties || [] });
          setActiveIndex(-1);
        }
      } catch {
        /* aborted / network error — ignore */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery]);

  const items: Array<{ kind: 'area'; label: string } | { kind: 'property'; property: SuggestedProperty }> = [
    ...suggest.areas.map((a) => ({ kind: 'area' as const, label: a })),
    ...suggest.properties.map((p) => ({ kind: 'property' as const, property: p })),
  ];
  const hasSuggestions = items.length > 0;

  const goToArea = (area: string) => {
    setShowSuggest(false);
    router.push(`/listings?city=${encodeURIComponent(area)}`);
  };

  const goToProperty = (p: SuggestedProperty) => {
    setShowSuggest(false);
    router.push(`/listings/${encodeURIComponent(p.mlsNumber || p.id)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (activeIndex >= 0 && items[activeIndex]) {
      const item = items[activeIndex];
      if (item.kind === 'area') goToArea(item.label);
      else goToProperty(item.property);
      return;
    }
    // A term that is exactly one of the suggested towns is an area search,
    // not a free-text one, so the results page opens with that filter set.
    const area = suggest.areas.find((a) => a.toLowerCase() === q.toLowerCase());
    if (area) {
      goToArea(area);
      return;
    }
    setShowSuggest(false);
    router.push(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggest || !hasSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
      setActiveIndex(-1);
    }
  };

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--modern-black)]">
      {/* Background Media - Rolex-style cinematic presentation */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.85) contrast(1.1)' }}
            poster={fallbackImageUrl}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${fallbackImageUrl})`,
              filter: 'brightness(0.85) contrast(1.1)'
            }}
          />
        )}

        {/* Modern gradient overlay - Rolex/Patek style */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--modern-black)] via-transparent to-[var(--modern-black)]/40" />
        <div className="absolute inset-0 bg-[var(--modern-black)]/20" />
      </div>

      {/* Content - Omega/Rolex inspired centered layout */}
      <div className="relative z-10 h-full flex flex-col justify-end items-center text-center px-6 pb-24 md:pb-32">
        {/* Title - Patek Philippe inspired typography */}
        <h1 className="modern-hero-title text-white mb-6 max-w-4xl hero-rise" style={{ animationDelay: '0.1s' }}>
          {title}
        </h1>

        {/* Subtitle - Clean, minimal */}
        <p
          className="text-white/70 text-sm md:text-base font-light tracking-[0.15em] uppercase max-w-xl mb-12 hero-rise"
          style={{ animationDelay: '0.2s' }}
        >
          {subtitle}
        </p>

        {/* Search Box - Modern minimal style */}
        <form onSubmit={handleSearch} className="w-full max-w-xl hero-rise" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <div className="flex items-stretch">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggest && hasSuggestions}
                aria-controls="hero-search-suggestions"
                aria-autocomplete="list"
                placeholder="Search by location, address or MLS#"
                className="flex-1 min-w-0 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/30 border-r-0 text-white text-sm placeholder-white/50 tracking-wider focus:outline-none focus:border-[var(--modern-gold)] focus:bg-white/15 transition-all duration-300"
              />
              <button
                type="submit"
                className="btn-modern-cta group shrink-0"
              >
                <span className="hidden sm:inline">Explore</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {showSuggest && hasSuggestions && (
              <ul
                id="hero-search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto bg-[var(--modern-black)]/95 backdrop-blur-md border border-white/20 text-left shadow-2xl"
              >
                {items.map((item, index) => {
                  const active = index === activeIndex;
                  const rowClass = `flex w-full items-center gap-3 px-5 py-3 text-sm font-light tracking-wide transition-colors duration-150 ${
                    active ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`;
                  if (item.kind === 'area') {
                    return (
                      <li key={`area-${item.label}`} role="option" aria-selected={active}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            goToArea(item.label);
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={rowClass}
                        >
                          <svg className="w-4 h-4 shrink-0 text-[var(--modern-gold)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="truncate">{item.label}</span>
                          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/50">Area</span>
                        </button>
                      </li>
                    );
                  }
                  const p = item.property;
                  return (
                    <li key={`prop-${p.id}`} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          goToProperty(p);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={rowClass}
                      >
                        <svg className="w-4 h-4 shrink-0 text-[var(--modern-gold)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        <span className="truncate">
                          <span className="text-white">{p.street}</span>
                          {p.city && (
                            <span className="text-white/60">
                              , {p.city}
                              {p.state ? `, ${p.state}` : ''}
                            </span>
                          )}
                        </span>
                        {p.mlsNumber && (
                          <span className="ml-auto shrink-0 text-xs text-white/50">MLS# {p.mlsNumber}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </form>

      </div>
    </section>
  );
}
