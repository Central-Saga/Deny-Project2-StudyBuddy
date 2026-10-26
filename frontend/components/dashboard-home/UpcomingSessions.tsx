import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, Clock, Users } from 'lucide-react';
import type { StudySession } from './types';
import { formatDate, formatTime, getEndTime } from './utils';

type UpcomingSessionsProps = {
  upcomingSessions: StudySession[];
};

export default function UpcomingSessions({
  upcomingSessions,
}: UpcomingSessionsProps) {
  return (
  <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Sesi Mendatang
              </h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                {upcomingSessions.length}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Jadwal belajar terdekat dari grup yang kamu ikuti.
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/calendar"
        className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Lihat semua
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
    {upcomingSessions.length > 0 ? (
      <div className="space-y-3">
        {upcomingSessions.map((session) => (
          <Link
            key={session.id}
            href="/dashboard/calendar"
            className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-800">
                  {session.title}
                </h3>
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                  {session.study_group?.name ||
                    session.subject?.name ||
                    'Sesi Belajar'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(session.scheduled_at)}
                    {' - '}
                    {getEndTime(
                      session.scheduled_at,
                      session.duration_minutes
                    )}
                  </span>
                  {typeof session.participants_count ===
                    'number' && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {session.participants_count}
                      {session.max_participants
                        ? `/${session.max_participants}`
                        : ''}{' '}
                      peserta
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
              Lihat Sesi
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 px-6 py-9 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">
          <Calendar className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-700">
          Belum ada sesi mendatang
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Sesi belajar dari grup yang kamu ikuti akan tampil
          otomatis di sini.
        </p>
        <Link
          href="/dashboard/calendar"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          Buka Kalender
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )}
  </div>
  );
}
