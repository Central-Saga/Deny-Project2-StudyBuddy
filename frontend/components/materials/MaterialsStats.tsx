import { BookOpen, CalendarDays, FileText, Upload } from 'lucide-react';

interface MaterialsStatsProps {
  hasLoadedMaterials: boolean;
  totalMaterials: number;
  shownCount: number;
  currentPage: number;
  lastPage: number;
}

export default function MaterialsStats({
  hasLoadedMaterials,
  totalMaterials,
  shownCount,
  currentPage,
  lastPage,
}: MaterialsStatsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Materi
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {hasLoadedMaterials ? totalMaterials : '—'}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Tersimpan di database
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Ditampilkan
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {hasLoadedMaterials ? shownCount : '—'}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Materi pada halaman ini
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Halaman
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {hasLoadedMaterials ? currentPage : '—'}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Dari {hasLoadedMaterials ? lastPage : '—'} halaman
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Batas Upload
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              10 MB
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Upload className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Sesuai validasi backend
        </p>
      </div>
    </section>
  );
}
