import { notFound } from 'next/navigation';
import LegalDocPage from '@/components/LegalDocPage';
import { LEGAL_DOCS, isLegalDocId } from '@/lib/legal';

const TITLES: Record<string, string> = {
  terms: 'Terms',
  privacy: 'Privacy',
  imprint: 'Imprint',
};

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const title = TITLES[doc] || 'Legal';
  return { title: `${title} — RelayHorizon` };
}

export default async function LegalDocRoute({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isLegalDocId(doc)) {
    notFound();
  }
  return <LegalDocPage doc={doc} />;
}
