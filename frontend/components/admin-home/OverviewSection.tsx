import { Activity, ShieldCheck } from 'lucide-react';
import { HorizontalBarChart, DonutMetric } from '@/components/admin-home/DashboardCharts';
import type { DashboardStats, DistributionItem } from '@/components/admin-home/types';

export default function OverviewSection({
  stats,
  activeUserRate,
  verifiedTutorRate,
  publishedQuizRate,
  reviewedReports,
  reviewedReportRate,
  distribution,
}: {
  stats: DashboardStats;
  activeUserRate: number;
  verifiedTutorRate: number;
  publishedQuizRate: number;
  reviewedReports: number;
  reviewedReportRate: number;
  distribution: DistributionItem[];
}) {
  return (
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/70 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-200/20 blur-3xl" />
  
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <Activity className="h-4 w-4" />
                </div>
  
                <div>
                  <h2 className="!text-slate-950 text-sm font-bold">
                    Platform Distribution
                  </h2>
  
                  <p className="mt-0.5 text-xs text-slate-400">
                    Distribusi data utama Study Buddy.
                  </p>
                </div>
              </div>
            </div>
  
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-white/90 px-3 py-1 text-[10px] font-semibold text-blue-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live snapshot
            </span>
          </div>
  
          <div className="relative mt-6">
            <HorizontalBarChart
              items={distribution}
            />
          </div>
        </div>
  
        <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl" />
  
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
  
              <div>
                <h2 className="!text-slate-950 text-sm font-bold">
                  Platform Health
                </h2>
  
                <p className="mt-0.5 text-xs text-slate-400">
                  Rasio penting platform.
                </p>
              </div>
            </div>
  
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
              Healthy
            </span>
          </div>
  
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <DonutMetric
              label="Active Users"
              percentage={activeUserRate}
              value={`${stats.active_users}/${stats.total_users}`}
              strokeClass="stroke-blue-500"
              accentClass="text-blue-600"
            />
  
            <DonutMetric
              label="Verified Tutors"
              percentage={verifiedTutorRate}
              value={`${stats.verified_tutors}/${stats.total_tutors}`}
              strokeClass="stroke-emerald-500"
              accentClass="text-emerald-600"
            />
  
            <DonutMetric
              label="Published Quiz"
              percentage={publishedQuizRate}
              value={`${stats.published_quizzes}/${stats.total_quizzes}`}
              strokeClass="stroke-violet-500"
              accentClass="text-violet-600"
            />
  
            <DonutMetric
              label="Reports Reviewed"
              percentage={reviewedReportRate}
              value={`${reviewedReports}/${stats.total_material_reports}`}
              strokeClass="stroke-amber-500"
              accentClass="text-amber-600"
            />
          </div>
        </div>
      </section>
  );
}
