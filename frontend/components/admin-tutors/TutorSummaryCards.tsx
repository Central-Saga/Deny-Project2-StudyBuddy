import { BadgeCheck, Clock3, UserRound, Users } from 'lucide-react';
import { SummaryCard } from '@/components/admin-tutors/TutorMetrics';

export default function TutorSummaryCards({ summary }: { summary: { total: number; verified: number; unverified: number; active: number } }) {
  return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Tutor"
          value={summary.total}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="!text-slate-950"
        />
        <SummaryCard
          label="Verified"
          value={summary.verified}
          icon={<BadgeCheck className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />
        <SummaryCard
          label="Belum Verified"
          value={summary.unverified}
          icon={<Clock3 className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-600"
        />
        <SummaryCard
          label="Tutor Aktif"
          value={summary.active}
          icon={<UserRound className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
          valueClass="text-indigo-600"
        />
      </section>
  );
}
