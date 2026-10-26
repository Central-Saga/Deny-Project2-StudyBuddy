import { Calendar, Clock, GraduationCap, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import type { StudyGroup, StudySession } from './types';

type SummaryCardsProps = {
  myGroups: StudyGroup[];
  upcomingSessions: StudySession[];
  groups: StudyGroup[];
  sessions: StudySession[];
};

export default function SummaryCards({
  myGroups,
  upcomingSessions,
  groups,
  sessions,
}: SummaryCardsProps) {
  return (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryCard
      label="Grup Saya"
      value={myGroups.length}
      description="Grup belajar yang kamu ikuti"
      icon={<Users className="h-5 w-5" />}
      iconClass="bg-indigo-50 text-indigo-600"
    />
    <SummaryCard
      label="Sesi Mendatang"
      value={upcomingSessions.length}
      description="Jadwal belajar terdekat"
      icon={<Calendar className="h-5 w-5" />}
      iconClass="bg-blue-50 text-blue-600"
    />
    <SummaryCard
      label="Grup Tersedia"
      value={groups.length}
      description="Grup yang dapat dijelajahi"
      icon={<GraduationCap className="h-5 w-5" />}
      iconClass="bg-violet-50 text-violet-600"
    />
    <SummaryCard
      label="Total Sesi"
      value={sessions.length}
      description="Sesi belajar yang tersedia"
      icon={<Clock className="h-5 w-5" />}
      iconClass="bg-emerald-50 text-emerald-600"
    />
  </section>
  );
}
