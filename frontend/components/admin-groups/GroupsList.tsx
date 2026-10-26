import { CalendarDays, Eye, Globe2, Lock, UsersRound } from 'lucide-react';
import { formatDate } from '@/components/admin-groups/utils';
import type { AdminGroup } from '@/components/admin-groups/types';

export default function GroupsList({
  groups,
  loading,
  loadGroupDetail,
}: {
  groups: AdminGroup[];
  loading: boolean;
  loadGroupDetail: (groupId: number) => Promise<void>;
}) {
  return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Study Group
          </h2>
  
          <p className="mt-1 text-xs text-slate-400">
            Monitoring informasi dan
            aktivitas group pengguna.
          </p>
        </div>
  
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound className="h-6 w-6" />
            </div>
  
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              Group tidak ditemukan
            </h3>
  
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Belum ada group yang sesuai
              dengan filter atau pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Group
                  </th>
  
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Creator
                  </th>
  
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Members
                  </th>
  
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sessions
                  </th>
  
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Privacy
                  </th>
  
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dibuat
                  </th>
  
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
  
              <tbody className="divide-y divide-slate-100">
                {groups.map(
                  (group) => (
                    <tr
                      key={group.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[250px]">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {
                              group.name
                            }
                          </p>
  
                          <p className="mt-1 truncate text-[11px] text-slate-400">
                            {group.subject
                              ?.name ||
                              'Tanpa subject'}
                          </p>
                        </div>
                      </td>
  
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-700">
                          {group.creator
                            ?.name ||
                            '-'}
                        </p>
  
                        <p className="mt-1 text-[11px] text-slate-400">
                          {group.creator
                            ?.email ||
                            '-'}
                        </p>
                      </td>
  
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-700">
                          {
                            group
                              .member_stats
                              .accepted
                          }
                          {' / '}
                          {
                            group.max_members
                          }
                        </div>
  
                        {group
                          .member_stats
                          .pending >
                          0 && (
                          <p className="mt-1 text-[10px] font-medium text-amber-600">
                            {
                              group
                                .member_stats
                                .pending
                            }{' '}
                            pending
                          </p>
                        )}
                      </td>
  
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
  
                          {
                            group.sessions_count
                          }
                        </span>
                      </td>
  
                      <td className="px-5 py-4">
                        {group.is_private ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                            <Lock className="h-3 w-3" />
  
                            Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <Globe2 className="h-3 w-3" />
  
                            Public
                          </span>
                        )}
                      </td>
  
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(
                          group.created_at
                        )}
                      </td>
  
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void loadGroupDetail(
                              group.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
  
                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
