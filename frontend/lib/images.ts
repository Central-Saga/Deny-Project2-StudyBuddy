export const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:8000'
).replace(/\/$/, '');

// Optimizer Next berjalan di server (container) sehingga tidak bisa mengambil
// gambar lewat origin browser seperti localhost:8000. URL storage backend
// dijadikan path same-origin yang diproksikan oleh rewrite /storage.
export function normalizeImageSrc(src: string): string {
  const prefix = `${BACKEND_ORIGIN}/storage/`;

  return src.startsWith(prefix) ? src.slice(BACKEND_ORIGIN.length) : src;
}
