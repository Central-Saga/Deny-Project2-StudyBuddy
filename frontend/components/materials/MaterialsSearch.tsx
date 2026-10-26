import { Search } from 'lucide-react';

interface MaterialsSearchProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setCurrentPage: (page: number) => void;
}

export default function MaterialsSearch({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
}: MaterialsSearchProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Cari Materi
          </h2>

          <p className="mt-1 text-[11px] text-slate-400">
            Pencarian dilakukan langsung melalui API.
          </p>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari judul, mata kuliah, atau deskripsi..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>
    </section>
  );
}
