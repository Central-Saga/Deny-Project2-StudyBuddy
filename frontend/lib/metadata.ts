import type { Metadata } from 'next';

export const SITE_NAME = 'StudyBuddy';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  // Halaman yang butuh login tidak perlu diindeks mesin pencari.
  isPrivate?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  isPrivate = false,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
    },
    ...(isPrivate ? { robots: { index: false, follow: false } } : {}),
  };
}
