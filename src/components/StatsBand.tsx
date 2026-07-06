type Stat = { value?: string; label?: string };

/** A centered trust-stats band. Renders nothing when there are no stats. */
export default function StatsBand({ stats }: { stats?: Stat[] }) {
  const items = (stats || []).filter((s) => s?.value || s?.label);
  if (items.length === 0) return null;

  const cols =
    items.length >= 4
      ? "grid-cols-2 md:grid-cols-4"
      : items.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414] border-y border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
        <div className={`grid ${cols} gap-8 text-center`}>
          {items.map((s, i) => (
            <div key={i}>
              <div className="font-serif text-4xl md:text-5xl font-light text-[#1a1a1a] dark:text-white mb-2 tracking-tight leading-none">
                {s.value}
              </div>
              <div className="text-xs md:text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
