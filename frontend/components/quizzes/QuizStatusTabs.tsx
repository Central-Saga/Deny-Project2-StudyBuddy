type QuizStatusTabsProps = {
  quizStatus: 'active' | 'inactive';
  setQuizStatus: (status: 'active' | 'inactive') => void;
};

export default function QuizStatusTabs({
  quizStatus,
  setQuizStatus,
}: QuizStatusTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={() => setQuizStatus('active')}
        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
          quizStatus === 'active'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        Kuis Aktif
      </button>
      <button
        type="button"
        onClick={() => setQuizStatus('inactive')}
        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
          quizStatus === 'inactive'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        Kuis Nonaktif Saya
      </button>
      <p className="ml-auto hidden px-2 text-[11px] text-slate-400 sm:block">
        {quizStatus === 'active'
          ? 'Kuis aktif dapat dilihat dan dikerjakan pengguna.'
          : 'Hanya kuis nonaktif milikmu yang ditampilkan.'}
      </p>
    </div>
  );
}
