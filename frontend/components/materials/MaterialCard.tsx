import { Download, Flag, Loader2, Pencil, Trash2 } from 'lucide-react';
import AvatarImage from '@/components/ui/AvatarImage';
import type { Material } from './types';

function getUploaderInitials(name?: string | null): string {
  return (name || 'Mahasiswa')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}
import {
  formatDate,
  formatFileSize,
  getFileIcon,
  getFileTypeLabel,
  getFileTypeStyle,
} from './utils';

interface MaterialCardProps {
  material: Material;
  deletingId: number | null;
  downloadingId: number | null;
  reporting: boolean;
  openEditModal: (material: Material) => void;
  setMaterialToDelete: (material: Material) => void;
  openReportModal: (material: Material) => void;
  handleDownload: (material: Material) => void;
}

export default function MaterialCard({
  material,
  deletingId,
  downloadingId,
  reporting,
  openEditModal,
  setMaterialToDelete,
  openReportModal,
  handleDownload,
}: MaterialCardProps) {
  return (
    <article
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      {/* Card Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            {material.subject}
          </span>

          <span
            className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${getFileTypeStyle(
              material.file_type
            )}`}
          >
            {getFileTypeLabel(material.file_type)}
          </span>

          {material.is_owner && (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              Materi Anda
            </span>
          )}
        </div>

        <span className="shrink-0 text-[10px] font-medium text-slate-400">
          {formatDate(material.created_at)}
        </span>
      </div>

      {/* File Icon + Title */}
      <div className="mt-5 flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getFileTypeStyle(
            material.file_type
          )}`}
        >
          {getFileIcon(material.file_type)}
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-blue-700">
            {material.title}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatFileSize(material.file_size)} ·{' '}
            {getFileTypeLabel(material.file_type)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
        {material.description ||
          'Tidak ada deskripsi untuk materi ini.'}
      </p>

      {/* Divider */}
      <div className="my-5 border-t border-slate-100" />

      {/* Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
            {material.user?.profile?.avatar_url ? (
              <AvatarImage
                src={material.user.profile.avatar_url}
                alt={`Foto profil ${material.user.name}`}
                size={36}
                className="h-full w-full object-cover"
                fallback={getUploaderInitials(material.user?.name)}
              />
            ) : (
              getUploaderInitials(material.user?.name)
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
              Diunggah oleh
            </p>

            <p className="truncate text-xs font-semibold text-slate-700">
              {material.user?.name || 'Mahasiswa'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {material.is_owner && (
            <>
              <button
                type="button"
                onClick={() => openEditModal(material)}
                disabled={
                  deletingId === material.id ||
                  downloadingId === material.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => setMaterialToDelete(material)}
                disabled={
                  deletingId === material.id ||
                  downloadingId === material.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === material.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deletingId === material.id
                  ? 'Menghapus...'
                  : 'Hapus'}
              </button>
            </>
          )}

          {!material.is_owner && (
            <button
              type="button"
              onClick={() => openReportModal(material)}
              disabled={
                downloadingId === material.id ||
                deletingId === material.id ||
                reporting
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Flag className="h-4 w-4" />
              Laporkan
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownload(material)}
            disabled={
              downloadingId === material.id ||
              deletingId === material.id
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingId === material.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Unduh Materi
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
