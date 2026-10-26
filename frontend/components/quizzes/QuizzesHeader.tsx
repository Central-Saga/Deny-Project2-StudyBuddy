import { FileQuestion, Plus } from 'lucide-react';

type QuizzesHeaderProps = {
  openCreate: () => void;
};

export default function QuizzesHeader({ openCreate }: QuizzesHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
              Interactive Quiz
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Kuis Belajar
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Buat, kerjakan, edit, dan kelola kuis pembelajaran.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Buat Kuis
        </button>
      </div>
    </section>
  );
}
