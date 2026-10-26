import {
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'subjects'
  | 'refreshing'
  | 'fetchGroups'
  | 'openCreateModal'
>;

export default function GroupsHeader({
  subjects,
  refreshing,
  fetchGroups,
  openCreateModal,
}: Props) {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Study Community
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Grup Belajar
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Temukan grup belajar, kelola komunitas, dan proses
                permintaan anggota dari satu halaman.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchGroups(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Baru
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
