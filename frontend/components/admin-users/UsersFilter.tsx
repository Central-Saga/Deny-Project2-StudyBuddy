import { Search, X } from 'lucide-react';
import type { StatusFilter } from './types';

interface UsersFilterProps {
  search: string;
  setSearch: (value: string) => void;
  handleSearch: (event: React.FormEvent) => void;
  clearSearch: () => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
}

export default function UsersFilter({
  search,
  setSearch,
  handleSearch,
  clearSearch,
  statusFilter,
  setStatusFilter,
}: UsersFilterProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row">
        <form
          onSubmit={handleSearch}
          className="flex flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Cari nama atau email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Cari
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as StatusFilter
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 lg:w-48"
        >
          <option value="all">
            Semua Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>
        </select>
      </div>
    </div>
  );
}
