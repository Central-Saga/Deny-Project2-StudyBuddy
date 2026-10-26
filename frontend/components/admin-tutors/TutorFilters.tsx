import { Search } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { VerificationFilter, TutorStatusFilter } from '@/components/admin-tutors/types';

export default function TutorFilters({
  searchQuery,
  setSearchQuery,
  verificationFilter,
  setVerificationFilter,
  statusFilter,
  setStatusFilter,
}: {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  verificationFilter: VerificationFilter;
  setVerificationFilter: Dispatch<SetStateAction<VerificationFilter>>;
  statusFilter: TutorStatusFilter;
  setStatusFilter: Dispatch<SetStateAction<TutorStatusFilter>>;
}) {
  return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Cari nama, email, universitas, jurusan, atau mata kuliah..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
  
          <select
            value={verificationFilter}
            onChange={(event) =>
              setVerificationFilter(
                event.target
                  .value as VerificationFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Semua Verifikasi
            </option>
            <option value="verified">
              Verified
            </option>
            <option value="unverified">
              Belum Verified
            </option>
          </select>
  
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as TutorStatusFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Semua Status
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </section>
  );
}
