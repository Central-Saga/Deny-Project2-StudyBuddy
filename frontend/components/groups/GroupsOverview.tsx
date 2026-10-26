import {
  Lock,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  SummaryCard,
} from './parts';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'groups'
  | 'hasLoadedGroups'
  | 'searchTerm'
  | 'setSearchTerm'
  | 'filteredGroups'
  | 'totalMembers'
  | 'privateGroups'
  | 'joinedGroups'
>;

export default function GroupsOverview({
  groups,
  hasLoadedGroups,
  searchTerm,
  setSearchTerm,
  filteredGroups,
  totalMembers,
  privateGroups,
  joinedGroups,
}: Props) {
  return (
    <>
      {hasLoadedGroups && (
        <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Grup"
          value={groups.length}
          note="Komunitas belajar tersedia"
          icon={<Users className="h-5 w-5" />}
        />
        <SummaryCard
          label="Grup Saya"
          value={joinedGroups}
          note="Grup yang sedang diikuti"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total Anggota"
          value={totalMembers}
          note="Akumulasi anggota aktif"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <SummaryCard
          label="Grup Privat"
          value={privateGroups}
          note="Grup dengan persetujuan admin"
          icon={<Lock className="h-5 w-5" />}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama grup, mata kuliah, atau deskripsi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Menampilkan{' '}
            <span className="font-bold text-slate-800">
              {filteredGroups.length}
            </span>{' '}
            grup
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}
