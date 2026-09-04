import type { ReactNode } from 'react';

export default function LegalInline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1]) {
      nodes.push(<strong key={key}>{match[1]}</strong>);
    } else {
      nodes.push(
        <a key={key} href={match[3]}>
          {match[2]}
        </a>,
      );
    }
    key += 1;
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return <>{nodes}</>;
}
