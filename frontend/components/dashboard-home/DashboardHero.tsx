import Link from 'next/link';
import { Calendar, RefreshCw, Search, Sparkles } from 'lucide-react';
import type { UserDto } from '@/types/api';
import type { StudySession, StudyGroup } from './types';

type DashboardHeroProps = {
  userData: UserDto | null;
  refreshing: boolean;
  loadDashboardData: (isRefresh?: boolean) => Promise<void>;
  myGroups: StudyGroup[];
  upcomingSessions: StudySession[];
  sessions: StudySession[];
};

export default function DashboardHero({
  userData,
  refreshing,
  loadDashboardData,
  myGroups,
  upcomingSessions,
  sessions,
}: DashboardHeroProps) {
  return (
  <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/10 sm:p-7">
    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />
    <div className="relative z-10 grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-50 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Dashboard Mahasiswa
        </div>
        <h1 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          Halo, {userData?.name || 'Mahasiswa'} 👋
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100 sm:text-sm">
          Belajar lebih terarah bersama Study Buddy.
          Temukan partner belajar, ikuti grup, dan
          persiapkan sesi berikutnya dari satu tempat.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/find-buddy"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            <Search className="h-3.5 w-3.5" />
            Cari Study Buddy
          </Link>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <Calendar className="h-3.5 w-3.5" />
            Lihat Kalender
          </Link>
        </div>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100">
              Ringkasan Belajar
            </p>
            <p className="mt-1 text-xs text-white/70">
              Aktivitas akunmu saat ini
            </p>
          </div>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadDashboardData(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-xl font-bold">
              {myGroups.length}
            </p>
            <p className="mt-1 text-[9px] font-medium text-blue-100">
              Grup Saya
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-xl font-bold">
              {upcomingSessions.length}
            </p>
            <p className="mt-1 text-[9px] font-medium text-blue-100">
              Mendatang
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <p className="text-xl font-bold">
              {sessions.length}
            </p>
            <p className="mt-1 text-[9px] font-medium text-blue-100">
              Total Sesi
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
}
