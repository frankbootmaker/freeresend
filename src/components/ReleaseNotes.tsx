'use client';

import { usePrefs } from '@/contexts/PrefsContext';
import { APP_VERSION, RELEASES, displayVersion, type ReleaseChangeKind } from '@/lib/releases';

export default function ReleaseNotes({ onClose }: { onClose: () => void }) {
  const { t } = usePrefs();

  const kindLabel: Record<ReleaseChangeKind, string> = {
    added: t.changelog.added,
    changed: t.changelog.changed,
    fixed: t.changelog.fixed,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-notes-title"
      >
        <div className="releasenotes-head">
          <h2 id="release-notes-title">{t.changelog.title}</h2>
          <button type="button" className="button" onClick={onClose}>
            {t.changelog.close}
          </button>
        </div>
        <p className="muted">{t.changelog.lead}</p>
        <ol className="releaselist">
          {RELEASES.map((release) => (
            <li key={release.version} className="release">
              <h3>
                {displayVersion(release.version)}
                {release.version === APP_VERSION ? (
                  <span className="release-current">{t.changelog.current}</span>
                ) : null}
              </h3>
              <time dateTime={release.date}>{release.date}</time>
              <p>{release.summary}</p>
              <ul>
                {release.changes.map((change) => (
                  <li key={`${release.version}-${change.text}`}>
                    <b>{kindLabel[change.kind]}.</b> {change.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
