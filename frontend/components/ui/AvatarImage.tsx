'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { normalizeImageSrc } from '@/lib/images';

type AvatarImageProps = {
  src: string;
  alt: string;
  fallback: ReactNode;
  className?: string;
  // Tanpa size, gambar memakai fill dan induknya harus relative.
  size?: number;
  sizes?: string;
};

export default function AvatarImage({
  src,
  alt,
  fallback,
  className,
  size,
  sizes,
}: AvatarImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return <>{fallback}</>;
  }

  const resolvedSrc = normalizeImageSrc(src);
  const handleError = () => setFailedSrc(src);

  if (size) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        width={size}
        height={size}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={handleError}
    />
  );
}
