'use client';

import { useState, useEffect, useRef } from 'react';
import { getUTMData } from './UTMCapture';
import { trackLeadSubmitted } from '@/lib/tracking';

export default function ModernContactCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight;
        // Only run when the section is anywhere near the viewport.
        if (rect.bottom < -200 || rect.top > viewportH + 200) return;
        // Map section position to a slow vertical translation.
        // When section top sits at viewport bottom, offset ≈ -viewportH * 0.15.
        // When section top sits above viewport, offset ≈ +rect distance * 0.15.
        setParallaxY((viewportH - rect.top) * 0.15);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const utm = getUTMData();
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          source: 'Homepage Contact Form',
          leadType: 'contact',
          sourceUrl: utm.source_url,
          referrer: utm.referrer,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          utmContent: utm.utm_content,
          utmTerm: utm.utm_term,
          gclid: utm.gclid,
          fbclid: utm.fbclid,
          msclkid: utm.msclkid,
          landingPage: utm.landing_page,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      trackLeadSubmitted({
        leadType: 'contact',
        email: formState.email,
        phone: formState.phone || undefined,
      });
      setSubmitted(true);
      setFormState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Parallax background — drop an image at /public/cta-bg.jpg to replace the gradient */}
      <div
        aria-hidden
        className="absolute inset-x-0 -top-[20%] -bottom-[20%] pointer-events-none"
        style={{
          backgroundColor: '#1f1f1f',
          backgroundImage: 'url(/cta-bg.jpg), linear-gradient(180deg, #2a2a2a 0%, #141414 100%)',
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          transform: `translate3d(0, ${parallaxY}px, 0)`,
          willChange: 'transform',
        }}
      />
      {/* White wash keeps the existing dark text + form legible over any image */}
      <div aria-hidden className="absolute inset-0 bg-white/85 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Column - Text */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] mb-6">
              Let&apos;s Start a Conversation
            </h2>
            <p className="text-[var(--modern-gray)] text-base md:text-lg font-light leading-relaxed mb-8">
              Whether you&apos;re looking to buy, sell, or simply explore the market,
              we&apos;re here to provide the guidance and expertise you deserve.
              Reach out and let us help you find your next chapter.
            </p>
            <div className="w-16 h-[1px] bg-[var(--modern-gold)]" />
          </div>

          {/* Right Column - Form */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 border border-[var(--modern-gold)] flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[var(--modern-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light text-[var(--modern-black)] mb-3">
                  Thank You
                </h3>
                <p className="text-[var(--modern-gray)] font-light">
                  We&apos;ve received your message and will be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cta-firstName" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      First Name *
                    </label>
                    <input
                      id="cta-firstName"
                      type="text"
                      required
                      value={formState.firstName}
                      onChange={(e) => setFormState(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-lastName" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Last Name *
                    </label>
                    <input
                      id="cta-lastName"
                      type="text"
                      required
                      value={formState.lastName}
                      onChange={(e) => setFormState(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cta-email" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Email *
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-phone" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                      Phone
                    </label>
                    <input
                      id="cta-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cta-message" className="block text-xs uppercase tracking-[0.15em] text-[var(--modern-gray)] mb-2">
                    Message
                  </label>
                  <textarea
                    id="cta-message"
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-transparent border-b border-[var(--modern-gray-lighter)] text-[var(--modern-black)] text-sm font-light py-3 focus:border-[var(--modern-gold)] focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm font-light">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-3 bg-[var(--modern-black)] text-white text-xs uppercase tracking-[0.2em] px-10 py-4 hover:bg-[var(--modern-gold)] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                  {!submitting && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
