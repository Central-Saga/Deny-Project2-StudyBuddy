import { AlertTriangle, BadgeCheck, CheckCircle2, FileQuestion, FileWarning, GraduationCap, UserX, Users, UsersRound } from 'lucide-react';
import { AttentionItem, QuickAction } from '@/components/admin-home/DashboardLinks';
import type { DashboardStats } from '@/components/admin-home/types';

export default function ActionsSection({ stats }: { stats: DashboardStats }) {
  return (
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <h2 className="!text-slate-950 text-sm font-bold">
                Needs Attention
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Area yang perlu ditinjau admin.
              </p>
            </div>
          </div>
  
          <div className="mt-5 space-y-3">
            <AttentionItem
              icon={
                <UserX className="h-4 w-4" />
              }
              label="Suspended Users"
              value={
                stats.suspended_users
              }
              href="/admin/users"
              tone="red"
            />
  
            <AttentionItem
              icon={
                <FileWarning className="h-4 w-4" />
              }
              label="Pending Material Reports"
              value={
                stats.pending_material_reports
              }
              href="/admin/reports"
              tone="amber"
            />
  
            <AttentionItem
              icon={
                <GraduationCap className="h-4 w-4" />
              }
              label="Unverified Tutors"
              value={Math.max(
                0,
                stats.total_tutors -
                  stats.verified_tutors
              )}
              href="/admin/tutors"
              tone="blue"
            />
  
            <AttentionItem
              icon={
                <FileQuestion className="h-4 w-4" />
              }
              label="Unpublished Quizzes"
              value={Math.max(
                0,
                stats.total_quizzes -
                  stats.published_quizzes
              )}
              href="/admin/quizzes"
              tone="slate"
            />
          </div>
        </div>
  
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="!text-slate-950 text-sm font-bold">
                Quick Management
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Akses cepat ke fitur admin.
              </p>
            </div>
  
            <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Shortcuts
            </span>
          </div>
  
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/admin/users"
              title="Manage Users"
              description="Kelola status akun pengguna."
              icon={
                <Users className="h-5 w-5" />
              }
              iconClass="bg-blue-50 text-blue-600"
            />
  
            <QuickAction
              href="/admin/groups"
              title="Study Groups"
              description="Pantau seluruh grup belajar."
              icon={
                <UsersRound className="h-5 w-5" />
              }
              iconClass="bg-indigo-50 text-indigo-600"
            />
  
            <QuickAction
              href="/admin/quizzes"
              title="Quiz Management"
              description="Moderasi dan pantau kuis."
              icon={
                <FileQuestion className="h-5 w-5" />
              }
              iconClass="bg-violet-50 text-violet-600"
            />
  
            <QuickAction
              href="/admin/tutors"
              title="Tutor Verification"
              description="Verifikasi peer tutor."
              icon={
                <BadgeCheck className="h-5 w-5" />
              }
              iconClass="bg-emerald-50 text-emerald-600"
            />
  
            <QuickAction
              href="/admin/reports"
              title="Material Reports"
              description="Tinjau laporan materi."
              icon={
                <FileWarning className="h-5 w-5" />
              }
              iconClass="bg-amber-50 text-amber-600"
            />
  
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
  
              <h3 className="mt-4 text-sm font-bold text-slate-700">
                Core Admin Ready
              </h3>
  
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Fitur admin utama sudah terhubung
                dalam satu panel.
              </p>
            </div>
          </div>
        </div>
      </section>
  );
}
