import { Loader2, Trash2 } from 'lucide-react';
import type { Material } from './types';

interface DeleteMaterialModalProps {
  materialToDelete: Material;
  deletingId: number | null;
  setMaterialToDelete: (material: Material | null) => void;
  handleDelete: (material: Material) => void;
}

export default function DeleteMaterialModal({
  materialToDelete,
  deletingId,
  setMaterialToDelete,
  handleDelete,
}: DeleteMaterialModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          deletingId === null
        ) {
          setMaterialToDelete(null);
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">
              Hapus materi?
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Materi{' '}
              <span className="font-semibold text-slate-700">
                {materialToDelete.title}
              </span>{' '}
              beserta file-nya akan dihapus dari server.
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={deletingId !== null}
            onClick={() => setMaterialToDelete(null)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={deletingId !== null}
            onClick={() => handleDelete(materialToDelete)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingId === materialToDelete.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {deletingId === materialToDelete.id
              ? 'Menghapus...'
              : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
