import { BadgeCheck, ChevronRight, Clock3, Star, UserRound } from 'lucide-react';
import { getInitials } from '@/components/admin-tutors/utils';
import { MiniMetric } from '@/components/admin-tutors/TutorMetrics';
import type { TutorListItem } from '@/components/admin-tutors/types';

export default function TutorTable({
  tutors,
  loading,
  filteredTutors,
  openDetail,
}: {
  tutors: TutorListItem[];
  loading: boolean;
  filteredTutors: TutorListItem[];
  openDetail: (tutor: TutorListItem) => Promise<void>;
}) {
  return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="!text-slate-950 text-sm font-bold">
            Daftar Peer Tutor
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Menampilkan {filteredTutors.length} dari {tutors.length} tutor.
          </p>
        </div>
  
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-slate-100"
                />
              )
            )}
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserRound className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              Tutor tidak ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Coba ubah kata pencarian atau filter yang sedang digunakan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTutors.map((tutor) => (
              <article
                key={tutor.id}
                className="p-5 transition hover:bg-slate-50/70"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-100">
                      {getInitials(tutor.name)}
                    </div>
  
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {tutor.name}
                        </h3>
  
                        {tutor.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            <Clock3 className="h-3 w-3" />
                            Belum Verified
                          </span>
                        )}
  
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            tutor.status === 'active'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tutor.status === 'active'
                            ? 'Active'
                            : 'Inactive'}
                        </span>
  
                        {tutor.account_status ===
                          'suspended' && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                            Account Suspended
                          </span>
                        )}
                      </div>
  
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {tutor.email}
                      </p>
  
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tutor.subjects
                          .slice(0, 4)
                          .map((subject) => (
                            <span
                              key={subject.id}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                            >
                              {subject.code
                                ? `${subject.code} · `
                                : ''}
                              {subject.name}
                            </span>
                          ))}
  
                        {tutor.subjects.length > 4 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            +{tutor.subjects.length - 4}{' '}
                            lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
  
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                    <MiniMetric
                      label="Rating"
                      value={Number(
                        tutor.rating_avg || 0
                      ).toFixed(1)}
                      icon={
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      }
                    />
                    <MiniMetric
                      label="Reviews"
                      value={String(
                        tutor.reviews_count
                      )}
                    />
                    <MiniMetric
                      label="Format"
                      value={
                        tutor.format_online &&
                        tutor.format_offline
                          ? 'Hybrid'
                          : tutor.format_online
                            ? 'Online'
                            : tutor.format_offline
                              ? 'Offline'
                              : '-'
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void openDetail(tutor)
                      }
                      className="flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
  );
}
