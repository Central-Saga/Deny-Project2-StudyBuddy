import { CalendarDays, Globe2, Lock, RefreshCw, ShieldCheck, UserRound, X } from 'lucide-react';
import { formatDate, formatDateTime } from '@/components/admin-groups/utils';
import type { AdminGroupDetail } from '@/components/admin-groups/types';

export default function GroupDetailModal({
  selectedGroup,
  detailLoading,
  detailError,
  closeDetail,
}: {
  selectedGroup: AdminGroupDetail | null;
  detailLoading: boolean;
  detailError: string;
  closeDetail: () => void;
}) {
  return (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            !detailLoading
          ) {
            closeDetail();
          }
        }}
      >
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">
                Detail Study Group
              </h2>
  
              <p className="mt-1 text-xs text-slate-400">
                Informasi group, member,
                dan sesi belajar.
              </p>
            </div>
  
            <button
              type="button"
              disabled={
                detailLoading
              }
              onClick={
                closeDetail
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
  
          <div className="overflow-y-auto p-5 sm:p-6">
            {detailLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
  
                  <p className="text-xs font-medium text-slate-500">
                    Memuat detail
                    group...
                  </p>
                </div>
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {detailError}
              </div>
            ) : selectedGroup ? (
              <div className="space-y-6">
                {/* INFO */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {
                          selectedGroup.name
                        }
                      </h3>
  
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {selectedGroup.description ||
                          'Tidak ada deskripsi.'}
                      </p>
                    </div>
  
                    {selectedGroup.is_private ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                        <Lock className="h-3.5 w-3.5" />
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <Globe2 className="h-3.5 w-3.5" />
                        Public
                      </span>
                    )}
                  </div>
  
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Subject
                      </p>
  
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {selectedGroup
                          .subject
                          ?.name ||
                          '-'}
                      </p>
                    </div>
  
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Creator
                      </p>
  
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {selectedGroup
                          .creator
                          ?.name ||
                          '-'}
                      </p>
                    </div>
  
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Kapasitas
                      </p>
  
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {
                          selectedGroup
                            .member_stats
                            .accepted
                        }
                        {' / '}
                        {
                          selectedGroup.max_members
                        }{' '}
                        member
                      </p>
                    </div>
  
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Dibuat
                      </p>
  
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatDate(
                          selectedGroup.created_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>
  
                {/* MEMBER STATS */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold text-emerald-700">
                      Accepted
                    </p>
  
                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {
                        selectedGroup
                          .member_stats
                          .accepted
                      }
                    </p>
                  </div>
  
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-[11px] font-semibold text-amber-700">
                      Pending
                    </p>
  
                    <p className="mt-1 text-xl font-bold text-amber-700">
                      {
                        selectedGroup
                          .member_stats
                          .pending
                      }
                    </p>
                  </div>
  
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-[11px] font-semibold text-red-600">
                      Rejected
                    </p>
  
                    <p className="mt-1 text-xl font-bold text-red-600">
                      {
                        selectedGroup
                          .member_stats
                          .rejected
                      }
                    </p>
                  </div>
  
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-[11px] font-semibold text-blue-700">
                      Group Admin
                    </p>
  
                    <p className="mt-1 text-xl font-bold text-blue-700">
                      {
                        selectedGroup
                          .member_stats
                          .group_admins
                      }
                    </p>
                  </div>
                </div>
  
                {/* MEMBERS */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Members
                    </h3>
                  </div>
  
                  {selectedGroup
                    .members
                    .length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada member.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedGroup.members.map(
                        (member) => (
                          <div
                            key={
                              member.id
                            }
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                {member.role ===
                                'admin' ? (
                                  <ShieldCheck className="h-4 w-4" />
                                ) : (
                                  <UserRound className="h-4 w-4" />
                                )}
                              </div>
  
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {member.user
                                    ?.name ||
                                    'User'}
                                </p>
  
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  {member.user
                                    ?.email ||
                                    '-'}
                                </p>
                              </div>
                            </div>
  
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-blue-700">
                                {
                                  member.role
                                }
                              </span>
  
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                                  member.status ===
                                  'accepted'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : member.status ===
                                        'pending'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {
                                  member.status
                                }
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
  
                {/* SESSIONS */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Study Sessions
                    </h3>
                  </div>
  
                  {selectedGroup
                    .sessions
                    .length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada sesi belajar.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedGroup.sessions.map(
                        (
                          session
                        ) => (
                          <div
                            key={
                              session.id
                            }
                            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {
                                  session.title
                                }
                              </p>
  
                              <p className="mt-1 text-[10px] text-slate-400">
                                Host ID:{' '}
                                {
                                  session.host_id
                                }
                              </p>
                            </div>
  
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                              <CalendarDays className="h-3.5 w-3.5" />
  
                              {formatDateTime(
                                session.scheduled_at
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}
