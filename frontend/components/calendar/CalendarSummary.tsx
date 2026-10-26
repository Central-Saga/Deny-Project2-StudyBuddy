import { BookOpen, CalendarDays, Sparkles, UsersRound } from 'lucide-react';
import { formatMonthLabel, type StudyGroup, type StudySession } from './utils';
type CalendarSummaryProps = {
  upcomingSessions: StudySession[];
  monthSessionCount: number;
  cursorDate: Date;
  creatorGroups: StudyGroup[];
  participantTotal: number;
  hasLoadedData: boolean;
};
export default function CalendarSummary({ upcomingSessions, monthSessionCount, cursorDate, creatorGroups, participantTotal, hasLoadedData }: CalendarSummaryProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Agenda Mendatang',
                value: upcomingSessions.length,
                note: 'Sesi aktif yang akan datang',
                Icon: CalendarDays,
                iconClass: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Sesi Bulan Ini',
                value: monthSessionCount,
                note: `Pada ${formatMonthLabel(cursorDate)}`,
                Icon: BookOpen,
                iconClass: 'bg-indigo-50 text-indigo-600',
              },
              {
                label: 'Grup Dikelola',
                value: creatorGroups.length,
                note: 'Grup yang Anda ketuai',
                Icon: UsersRound,
                iconClass: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Total Kehadiran',
                value: participantTotal,
                note: 'Total peserta dari sesi yang diambil',
                Icon: Sparkles,
                iconClass: 'bg-amber-50 text-amber-600',
              },
            ].map(({ label, value, note, Icon, iconClass }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{hasLoadedData ? value : "\u2014"}</p>
                  </div>
    <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
    <p className="mt-3 text-[11px] text-slate-400">{note}</p>
              </div>
            ))}
          </section>
  );
}
