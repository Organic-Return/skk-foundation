import { Fragment } from 'react';

/**
 * Renders text with runs of digits scaled up to cap height.
 *
 * Atacama draws its figures at roughly 85% of cap height — uniform among
 * themselves, but visibly short beside capitals, so "45 Ermine Lane, Snowmass
 * Village, CO 81615" reads as though the numbers were set a size down. The
 * usual remedy is the font's own `case` or lining-figure feature, but the file
 * we ship has no GSUB features at all, so the correction is made here.
 *
 * Only useful inside h1-h3, which is where Atacama is applied. Body copy is set
 * in Inter and needs none of this.
 */
export default function Figures({ children }: { children?: string | null }) {
  if (!children) return null;

  // Split on digit runs, keeping separators inside a number ("11,500,000")
  // attached to it but leaving sentence punctuation ("CO 81615,") outside.
  const parts = children.split(/(\d+(?:[.,]\d+)*)/g);

  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part) ? (
          <span key={i} className="cap-figures">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
