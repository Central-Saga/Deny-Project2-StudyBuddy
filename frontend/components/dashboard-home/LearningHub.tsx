import Link from 'next/link';
import { ArrowRight, BookOpen, FileQuestion, MessageSquare, Sparkles } from 'lucide-react';
import LearningHubItem from './LearningHubItem';

export default function LearningHub() {
  return (
  <aside className="rounded-[26px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
        <Sparkles className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Learning Hub
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Lanjutkan aktivitas belajarmu.
        </p>
      </div>
    </div>
    <div className="mt-5 space-y-3">
      <LearningHubItem
        href="/dashboard/materials"
        title="Jelajahi Materi"
        description="Cari referensi belajar"
        icon={<BookOpen className="h-4 w-4" />}
        iconClass="bg-cyan-50 text-cyan-600"
      />
      <LearningHubItem
        href="/dashboard/quizzes"
        title="Kerjakan Kuis"
        description="Uji pemahaman materi"
        icon={<FileQuestion className="h-4 w-4" />}
        iconClass="bg-amber-50 text-amber-600"
      />
      <LearningHubItem
        href="/dashboard/tutoring"
        title="Cari Tutor"
        description="Belajar bersama peer tutor"
        icon={<MessageSquare className="h-4 w-4" />}
        iconClass="bg-emerald-50 text-emerald-600"
      />
    </div>
    <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">
        Study Tip
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        Lengkapi profil belajar dan jadwalmu agar fitur
        Cari Buddy dapat memberikan hasil match yang lebih relevan.
      </p>
      <Link
        href="/dashboard/profile"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
      >
        Lengkapi Profil
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  </aside>
  );
}
