import { BookOpen, Plus } from 'lucide-react';

interface MaterialsHeaderProps {
  openCreateModal: () => void;
}

export default function MaterialsHeader({
  openCreateModal,
}: MaterialsHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-28 w-28 rounded-full bg-indigo-100/50 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <BookOpen className="h-6 w-6" />
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Study Materials
              </span>

              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                LIVE API
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Materi Belajar
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Temukan, bagikan, dan unduh materi belajar
              yang tersimpan langsung di server Study Buddy.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Unggah Materi
          </button>
        </div>
      </div>
    </section>
  );
}
