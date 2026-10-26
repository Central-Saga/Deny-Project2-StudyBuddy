import { Search } from 'lucide-react';
import type { AdminQuizListItem, QuizFilter } from './types';

interface QuizFiltersProps {
  quizzes: AdminQuizListItem[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: QuizFilter;
  setStatusFilter: (value: QuizFilter) => void;
  filteredQuizzes: AdminQuizListItem[];
}

export default function QuizFilters({
  quizzes,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredQuizzes,
}: QuizFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Cari judul, creator, email, atau mata kuliah..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as QuizFilter
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
        >
          <option value="all">
            Semua Status
          </option>
          <option value="published">
            Published
          </option>
          <option value="unpublished">
            Unpublished
          </option>
          <option value="admin_disabled">
            Admin Disabled
          </option>
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          Menampilkan{' '}
          <span className="font-semibold text-slate-700">
            {
              filteredQuizzes.length
            }
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-slate-700">
            {quizzes.length}
          </span>{' '}
          kuis
        </p>

        {(searchQuery ||
          statusFilter !==
            'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter(
                'all'
              );
            }}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700"
          >
            Reset Filter
          </button>
        )}
      </div>
    </section>
  );
}
