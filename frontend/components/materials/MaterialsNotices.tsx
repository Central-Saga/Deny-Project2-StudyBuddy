import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Material } from './types';

interface MaterialsNoticesProps {
  success: string;
  error: string;
  materialsLoadError: string;
  materials: Material[];
  currentPage: number;
  fetchMaterials: (page?: number) => Promise<void>;
}

export default function MaterialsNotices({
  success,
  error,
  materialsLoadError,
  materials,
  currentPage,
  fetchMaterials,
}: MaterialsNoticesProps) {
  return (
    <>
      {/* ================= SUCCESS ================= */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <span className="font-medium">
            {success}
          </span>
        </div>
      )}

      {/* ================= ERROR ================= */}
      {error && (!materialsLoadError || materials.length > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Terjadi kesalahan
            </p>

            <p className="mt-1 text-xs leading-5">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchMaterials(currentPage)}
              className="mt-2 text-xs font-bold underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
