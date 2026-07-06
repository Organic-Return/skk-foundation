type Testimonial = { quote?: string; author?: string; location?: string };

/** Client testimonials grid. Renders nothing when there are no testimonials. */
export default function TestimonialsSection({
  title,
  testimonials,
}: {
  title?: string;
  testimonials?: Testimonial[];
}) {
  const items = (testimonials || []).filter((t) => t?.quote);
  if (items.length === 0) return null;

  const cols = items.length >= 3 ? "md:grid-cols-3" : items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a] border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
        {title && (
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
            {title}
          </h2>
        )}
        <div className={`grid gap-8 ${cols}`}>
          {items.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col bg-[#f8f7f5] dark:bg-[#141414] border border-[#e8e6e3] dark:border-gray-800 p-8 md:p-10"
            >
              <svg
                className="w-8 h-8 text-[var(--color-gold)] mb-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M9.13 8.6c.31-.68.6-1.2.86-1.57L8.3 6C7.4 7.2 6.7 8.4 6.2 9.6c-.5 1.2-.75 2.5-.75 3.9 0 1.35.36 2.43 1.07 3.24.71.81 1.64 1.21 2.78 1.21 1 0 1.83-.32 2.48-.96.65-.64.97-1.46.97-2.46 0-.9-.28-1.65-.83-2.24-.55-.59-1.26-.89-2.13-.89-.2 0-.4.02-.6.06-.19.04-.32.07-.38.09.03-.32.14-.66.32-1.04zm8.5 0c.31-.68.6-1.2.86-1.57L16.8 6c-.9 1.2-1.6 2.4-2.1 3.6-.5 1.2-.75 2.5-.75 3.9 0 1.35.36 2.43 1.07 3.24.71.81 1.64 1.21 2.78 1.21 1 0 1.82-.32 2.47-.96.65-.64.98-1.46.98-2.46 0-.9-.28-1.65-.83-2.24-.55-.59-1.26-.89-2.13-.89-.2 0-.4.02-.59.06-.2.04-.33.07-.39.09.03-.32.14-.66.32-1.04z" />
              </svg>
              <blockquote className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed text-[16px] flex-1">
                {t.quote}
              </blockquote>
              {(t.author || t.location) && (
                <figcaption className="mt-6 pt-6 border-t border-[#e8e6e3] dark:border-gray-800">
                  {t.author && (
                    <div className="font-serif text-lg font-light text-[#1a1a1a] dark:text-white tracking-wide">
                      {t.author}
                    </div>
                  )}
                  {t.location && (
                    <div className="text-xs uppercase tracking-[0.15em] font-light text-[var(--color-gold)] mt-1">
                      {t.location}
                    </div>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
