'use client';

import { usePrefs } from '@/contexts/PrefsContext';
import { getGuide, type GuideKind } from '@/lib/guides';

export default function GuideTab({ kind }: { kind: GuideKind }) {
  const { locale } = usePrefs();
  const guide = getGuide(kind, locale);

  return (
    <div className="guide">
      <section className="card">
        <header className="cardhead">
          <h2>{guide.title}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{guide.lead}</p>
        </div>
      </section>
      {guide.sections.map((section) => (
        <section key={section.id} className="card">
          <header className="cardhead">
            <h2>{section.title}</h2>
          </header>
          <div className="cardbody">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
