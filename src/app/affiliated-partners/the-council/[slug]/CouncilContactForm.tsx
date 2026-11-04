'use client';

import { useState } from 'react';
import { getUTMData } from '@/components/UTMCapture';
import { getRecaptchaToken } from '@/lib/recaptchaClient';
import { trackLeadSubmitted } from '@/lib/tracking';

interface CouncilContactFormProps {
  /** Full name of the Council member this introduction is about. */
  memberName: string;
  memberLocation?: string;
  /** The site's own agent, who makes the introduction. */
  agentFirstName: string;
}

/**
 * Introduction request on a Council member's profile. Posts to the site's
 * contact endpoint with the member named in the interest field, so the lead
 * arrives tagged with who the visitor wants to be introduced to.
 */
export default function CouncilContactForm({ memberName, memberLocation, agentFirstName }: CouncilContactFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const memberFirstName = memberName.split(' ')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const utm = getUTMData();
      const recaptchaToken = await getRecaptchaToken('contact');
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recaptchaToken,
          ...formData,
          interest: `Council introduction: ${memberName}${memberLocation ? ` (${memberLocation})` : ''}`,
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

      if (response.ok) {
        trackLeadSubmitted({ leadType: 'contact', email: formData.email, phone: formData.phone || undefined });
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = 'block text-[11px] uppercase tracking-[0.18em] text-white/60 mb-1.5';
  const inputClass =
    'w-full border-0 border-b border-white/25 bg-transparent py-2 px-0 text-white placeholder:text-white/35 focus:border-[var(--color-gold)] focus:ring-0 outline-none transition-colors font-light';

  if (submitStatus === 'success') {
    return (
      <div className="py-6" role="status">
        <p className="font-serif text-2xl text-white mb-2">Thank you.</p>
        <p className="text-white/70 text-sm font-light leading-relaxed">
          {agentFirstName} will be in touch shortly to introduce you to {memberFirstName}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
        <div>
          <label htmlFor="council-name" className={labelClass}>Name</label>
          <input
            id="council-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="council-email" className={labelClass}>Email</label>
          <input
            id="council-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="council-phone" className={labelClass}>Phone <span className="normal-case tracking-normal text-white/40">(optional)</span></label>
        <input
          id="council-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={formData.phone}
          onChange={handleInputChange}
          className={inputClass}
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label htmlFor="council-message" className={labelClass}>Message</label>
        <textarea
          id="council-message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleInputChange}
          className={`${inputClass} resize-none`}
          placeholder={`I'd like an introduction to ${memberFirstName}${memberLocation ? ` about ${memberLocation}` : ''}...`}
        />
      </div>

      {submitStatus === 'error' && (
        <p className="text-sm text-red-300 font-light" role="alert">
          Something went wrong sending your message. Please try again or call us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-gold)] border border-[var(--color-gold)] text-white text-[11px] uppercase tracking-[0.2em] font-light hover:bg-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Request an Introduction'}
      </button>
      <p className="text-[11px] text-white/40 font-light leading-relaxed">
        Your details go to {agentFirstName} only and are never shared with third parties.
      </p>
    </form>
  );
}
