import type { BuddyDetailDto } from '@/types/api';
import { BookOpen, Brain, CalendarDays, ExternalLink, Code2, GraduationCap, Mail, Phone, School, Users, Clock3, Loader2, Sparkles, UserPlus, X } from 'lucide-react';

export function BuddyDetailModal({
  buddy,
  loading,
  onClose,
  onGoGroups,
}: {
  buddy: BuddyDetailDto | null;
  loading: boolean;
  onClose: () => void;
  onGoGroups: () => void;
}) {
  const dayNames = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];
  const initials = buddy?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-slate-50 shadow-2xl shadow-slate-950/25">
        {loading || !buddy ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />
              <p className="mt-3 text-xs font-medium text-slate-500">
                Memuat profil buddy...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* HERO */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 sm:h-36">
              <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 right-10 h-52 w-52 rounded-full bg-indigo-300/20 blur-3xl" />
              <div className="relative flex items-center justify-between px-5 py-4 sm:px-7">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                    Study Buddy Profile
                  </p>
                  <h2 className="mt-1 text-base font-bold text-white">
                    Profil Study Buddy
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Tutup profil"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* PROFILE HEADER */}
            <div className="relative border-b border-slate-200 bg-white px-5 pb-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:gap-5">
                  <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-lg sm:h-28 sm:w-28">
                    {buddy.profile?.avatar_url ? (
                      <img
                        src={buddy.profile.avatar_url}
                        alt={`Foto profil ${buddy.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials || 'U'
                    )}
                  </div>
                  <div className="min-w-0 pb-1 pt-3 sm:pt-0">
                    <h3 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                      {buddy.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{buddy.email}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {buddy.profile?.university && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          <School className="h-3 w-3" />
                          {buddy.profile.university}
                        </span>
                      )}
                      {buddy.profile?.major && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                          <GraduationCap className="h-3 w-3" />
                          {buddy.profile.major}
                        </span>
                      )}
                      {buddy.course && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          <BookOpen className="h-3 w-3" />
                          {buddy.course}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* CONTENT */}
            <div className="grid grid-cols-1 gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
              {/* LEFT */}
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Tentang Buddy</h4>
                      <p className="text-[10px] text-slate-400">Perkenalan singkat</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {buddy.bio || 'Buddy ini belum menambahkan bio.'}
                  </p>
                </section>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <Brain className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Gaya Belajar</h4>
                    </div>
                    {(buddy.learning_styles || []).length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {buddy.learning_styles?.map((style) => (
                          <span
                            key={style}
                            className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-slate-400">Belum ditambahkan.</p>
                    )}
                  </section>
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Mata Kuliah</h4>
                    </div>
                    {(buddy.subjects || []).length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {buddy.subjects?.map((subject) => (
                          <div
                            key={subject.id}
                            className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5"
                          >
                            {subject.code && (
                              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                                {subject.code}
                              </p>
                            )}
                            <p className="mt-0.5 text-xs font-semibold text-blue-800">
                              {subject.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-slate-400">Belum ditambahkan.</p>
                    )}
                  </section>
                </div>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Jadwal Tersedia</h4>
                      <p className="text-[10px] text-slate-400">Waktu yang cocok untuk belajar bersama</p>
                    </div>
                  </div>
                  {(buddy.availabilities || []).length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {buddy.availabilities?.map((availability, index) => (
                        <div
                          key={availability.id ?? `${availability.day_of_week}-${index}`}
                          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                            <Clock3 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {dayNames[availability.day_of_week] || 'Hari'}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                              {availability.start_time.slice(0, 5)} - {availability.end_time.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">Belum ada jadwal yang ditambahkan.</p>
                  )}
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Grup Belajar Terkait</h4>
                        <p className="text-[10px] text-slate-400">Grup yang dibuat buddy ini</p>
                      </div>
                    </div>
                    {(buddy.related_groups || []).length > 0 && (
                      <button
                        type="button"
                        onClick={onGoGroups}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        Buka Grup
                      </button>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    {(buddy.related_groups || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <Users className="mx-auto h-6 w-6 text-slate-300" />
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          Belum memiliki grup belajar terkait.
                        </p>
                      </div>
                    ) : (
                      buddy.related_groups?.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {group.name}
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-blue-600">
                                {group.subject?.name || 'Tanpa mata kuliah'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                              {group.members_count ?? 0}/{group.max_members ?? '-'} anggota
                            </span>
                          </div>
                          {group.description && (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                              {group.description}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
              {/* RIGHT */}
              <aside className="space-y-5">
                {(buddy.skills || []).length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Keahlian
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {buddy.skills?.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {(buddy.profile?.phone_number ||
                  buddy.profile?.github_url ||
                  buddy.profile?.linkedin_url) && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kontak & Profil
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {buddy.profile?.phone_number && (
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Telepon</p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {buddy.profile.phone_number}
                            </p>
                          </div>
                        </div>
                      )}
                      {buddy.profile?.github_url && (
                        <a
                          href={buddy.profile.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                            <Code2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">GitHub</p>
                            <p className="truncate text-xs font-semibold text-blue-600">Lihat profil GitHub</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-blue-500" />
                        </a>
                      )}
                      {buddy.profile?.linkedin_url && (
                        <a
                          href={buddy.profile.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-blue-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">LinkedIn</p>
                            <p className="truncate text-xs font-semibold text-blue-600">Lihat profil LinkedIn</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-blue-500" />
                        </a>
                      )}
                    </div>
                  </section>
                )}
                <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">
                    Cocok untuk belajar bareng?
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Tutup profil ini lalu gunakan tombol Ajak Belajar pada kartu buddy untuk mengirim permintaan koneksi.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
