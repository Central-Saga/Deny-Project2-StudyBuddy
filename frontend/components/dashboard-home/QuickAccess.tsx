import {
  BookOpen,
  Calendar,
  FileQuestion,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react';
import QuickActionCard from './QuickActionCard';

export default function QuickAccess() {
  return (
  <section>
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">
        Akses Cepat
      </h2>
      <p className="mt-0.5 text-[11px] text-slate-400">
        Pilih aktivitas belajar yang ingin kamu lakukan.
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <QuickActionCard
        href="/dashboard/find-buddy"
        title="Cari Study Buddy"
        description="Temukan teman belajar yang paling cocok."
        icon={<Search className="h-5 w-5" />}
        iconClass="bg-blue-50 text-blue-600"
        hoverClass="hover:border-blue-200"
      />
      <QuickActionCard
        href="/dashboard/groups"
        title="Grup Belajar"
        description="Gabung atau kelola grup belajarmu."
        icon={<Users className="h-5 w-5" />}
        iconClass="bg-indigo-50 text-indigo-600"
        hoverClass="hover:border-indigo-200"
      />
      <QuickActionCard
        href="/dashboard/calendar"
        title="Kalender"
        description="Atur dan pantau jadwal sesi belajar."
        icon={<Calendar className="h-5 w-5" />}
        iconClass="bg-sky-50 text-sky-600"
        hoverClass="hover:border-sky-200"
      />
      <QuickActionCard
        href="/dashboard/materials"
        title="Materi Belajar"
        description="Akses materi dari komunitas belajarmu."
        icon={<BookOpen className="h-5 w-5" />}
        iconClass="bg-cyan-50 text-cyan-600"
        hoverClass="hover:border-cyan-200"
      />
      <QuickActionCard
        href="/dashboard/quizzes"
        title="Kuis"
        description="Latih pemahamanmu melalui quiz."
        icon={<FileQuestion className="h-5 w-5" />}
        iconClass="bg-amber-50 text-amber-600"
        hoverClass="hover:border-amber-200"
      />
      <QuickActionCard
        href="/dashboard/tutoring"
        title="Peer Tutoring"
        description="Temukan tutor untuk belajar bersama."
        icon={<MessageSquare className="h-5 w-5" />}
        iconClass="bg-emerald-50 text-emerald-600"
        hoverClass="hover:border-emerald-200"
      />
    </div>
  </section>
  );
}
