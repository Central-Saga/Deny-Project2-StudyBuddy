import { AlertCircle, BookOpen, Loader2, Plus } from 'lucide-react';
import MaterialCard from './MaterialCard';
import type { Material } from './types';

interface MaterialsListProps {
  materials: Material[];
  loading: boolean;
  materialsLoadError: string;
  hasLoadedMaterials: boolean;
  currentPage: number;
  lastPage: number;
  deletingId: number | null;
  downloadingId: number | null;
  reporting: boolean;
  fetchMaterials: (page?: number) => Promise<void>;
  openCreateModal: () => void;
  openEditModal: (material: Material) => void;
  setMaterialToDelete: (material: Material) => void;
  openReportModal: (material: Material) => void;
  handleDownload: (material: Material) => void;
  handlePageChange: (page: number) => void;
}

export default function MaterialsList({
  materials,
  loading,
  materialsLoadError,
  hasLoadedMaterials,
  currentPage,
  lastPage,
  deletingId,
  downloadingId,
  reporting,
  fetchMaterials,
  openCreateModal,
  openEditModal,
  setMaterialToDelete,
  openReportModal,
  handleDownload,
  handlePageChange,
}: MaterialsListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
            Koleksi Materi
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Materi Terbaru
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Daftar materi diambil langsung dari database.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
          {hasLoadedMaterials ? materials.length : '—'} ditampilkan
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Memuat materi...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Mengambil data dari server
          </p>
        </div>
      ) : materialsLoadError && materials.length === 0 ? (
        <div
          role="alert"
          className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center"
        >
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="mt-4 text-base font-bold text-slate-800">
            Daftar materi belum dapat dimuat
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {materialsLoadError}
          </p>
          <button
            type="button"
            onClick={() => void fetchMaterials(currentPage)}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <BookOpen className="h-6 w-6 text-slate-300" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-700">
            Belum ada materi
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Tidak ada materi yang sesuai dengan
            pencarian kamu.
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Unggah Materi
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  deletingId={deletingId}
                  downloadingId={downloadingId}
                  reporting={reporting}
                  openEditModal={openEditModal}
                  setMaterialToDelete={setMaterialToDelete}
                  openReportModal={openReportModal}
                  handleDownload={handleDownload}
                />
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <p className="text-xs text-slate-400">
                Halaman{' '}
                <span className="font-semibold text-slate-700">
                  {hasLoadedMaterials ? currentPage : '—'}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-slate-700">
                  {lastPage}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(currentPage + 1)
                  }
                  disabled={currentPage === lastPage}
                  className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
