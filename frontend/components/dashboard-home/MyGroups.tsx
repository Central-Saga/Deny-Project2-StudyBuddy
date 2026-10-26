import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import type { StudyGroup } from './types';
import { getActiveMemberCount, getInitials } from './utils';

type MyGroupsProps = {
  myGroups: StudyGroup[];
};

export default function MyGroups({ myGroups }: MyGroupsProps) {
  return (
  <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Grup Saya
            </h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              {myGroups.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Grup belajar aktif yang sedang kamu ikuti.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/groups"
        className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Lihat semua
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
    {myGroups.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {myGroups.map((group) => {
          const memberCount =
            getActiveMemberCount(group);
          return (
            <Link
              key={group.id}
              href="/dashboard/groups"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-indigo-50/70" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm shadow-indigo-500/20">
                  {getInitials(group.name)}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                    group.is_private
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {group.is_private
                    ? 'Private'
                    : 'Publik'}
                </span>
              </div>
              <h3 className="relative mt-4 truncate text-sm font-bold text-slate-800 transition group-hover:text-indigo-600">
                {group.name}
              </h3>
              <p className="relative mt-1 truncate text-[11px] text-slate-400">
                {group.subject?.name ||
                  'Mata kuliah belum tersedia'}
              </p>
              <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {memberCount}
                  {group.max_members
                    ? `/${group.max_members}`
                    : ''}{' '}
                  anggota
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-100 bg-indigo-50/30 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-700">
          Belum bergabung ke grup
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Temukan grup belajar yang sesuai dengan mata kuliahmu
          atau buat grup baru bersama teman.
        </p>
        <Link
          href="/dashboard/groups"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          Cari Grup
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )}
  </section>
  );
}
