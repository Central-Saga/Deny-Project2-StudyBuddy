'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen, Brain, CalendarDays, Loader2, Search, Sparkles } from 'lucide-react';
import { useFindBuddy } from '@/hooks/find-buddy/useFindBuddy';
import { BuddyCard } from './BuddyCard';
import { BuddyDetailModal } from './BuddyDetailModal';
import { DAYS, LEARNING_STYLES } from './utils';

export default function FindBuddyClient() {
  const router = useRouter();
  const {
    buddies,
    subjects,
    loading,
    actionBuddyId,
    errorMsg,
    buddyLoadError,
    matchingMode,
    searchTerm,
    setSearchTerm,
    selectedSubjectIds,
    selectedLearningStyles,
    dayOfWeek,
    setDayOfWeek,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    detail,
    setDetail,
    detailLoading,
    toggleSubject,
    toggleLearningStyle,
    resetFilters,
    submitSearch,
    connectionRequest,
    acceptConnection,
    rejectConnection,
    removeConnection,
    openDetail,
    fetchBuddies,
  } = useFindBuddy();

  return (
    <div className="w-full space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/70 p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Smart Matching
              </p>
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Cari Study Buddy
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Cari partner belajar berdasarkan mata kuliah, jadwal, dan gaya belajar.
            </p>
          </div>
        </div>
      </section>
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
          matchingMode === 'none'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-blue-100 bg-blue-50 text-blue-700'
        }`}
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">
            {matchingMode === 'profile'
              ? 'Match otomatis dari profilmu'
              : matchingMode === 'filters'
                ? 'Filter pencarian aktif'
                : 'Lengkapi profil untuk mendapatkan Match'}
          </p>
          <p className="mt-1 leading-5 opacity-80">
            {matchingMode === 'profile'
              ? 'Sistem membandingkan mata kuliah, gaya belajar, dan jadwalmu dengan buddy lain. Filter di bawah bisa dipakai untuk mempersempit hasil.'
              : matchingMode === 'filters'
                ? 'Hasil dan skor otomatis diperbarui saat kamu mengubah filter.'
                : 'Tambahkan mata kuliah, gaya belajar, atau jadwal pada halaman Profil. Setelah itu skor Match akan dihitung otomatis.'}
          </p>
        </div>
      </div>
      <form
        onSubmit={submitSearch}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, mata kuliah, atau bio..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            <BookOpen className="h-4 w-4" /> Mata Kuliah
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => {
              const active = selectedSubjectIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {subject.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            <Brain className="h-4 w-4" /> Gaya Belajar
          </div>
          <div className="flex flex-wrap gap-2">
            {LEARNING_STYLES.map((style) => {
              const active = selectedLearningStyles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleLearningStyle(style)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            <CalendarDays className="h-4 w-4" /> Jadwal Tersedia
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"
            >
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={startTime}
              disabled={dayOfWeek === ''}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 disabled:text-slate-400 disabled:opacity-100"
            />
            <input
              type="time"
              value={endTime}
              disabled={dayOfWeek === ''}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 disabled:text-slate-400 disabled:opacity-100"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">
              Ditemukan <span className="font-bold text-slate-800">{buddies.length}</span> buddy.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {matchingMode === 'profile'
                ? 'Match dihitung otomatis dari profil belajarmu.'
                : matchingMode === 'filters'
                  ? 'Match mengikuti filter aktif dan data profilmu.'
                  : 'Lengkapi mata kuliah, gaya belajar, atau jadwal di Profil agar Match dapat dihitung.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cari Buddy
            </button>
          </div>
        </div>
      </form>
      {errorMsg && (!buddyLoadError || buddies.length > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">Mencari buddy yang cocok...</p>
        </div>
      ) : buddyLoadError && buddies.length === 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm"
        >
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h3 className="mt-4 text-base font-bold text-slate-800">
            Daftar Study Buddy belum dapat dimuat
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {buddyLoadError}
          </p>
          <button
            type="button"
            onClick={() => void fetchBuddies()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      ) : buddies.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {buddies.map((buddy) => (
            <BuddyCard
              key={buddy.id}
              buddy={buddy}
              busy={actionBuddyId === buddy.id}
              onView={() => void openDetail(buddy.id)}
              onConnect={() => void connectionRequest(buddy.id)}
              onAccept={() => void acceptConnection(buddy)}
              onReject={() => void rejectConnection(buddy)}
              onRemove={() => void removeConnection(buddy)}
              matchingMode={matchingMode}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Tidak Ada Study Buddy Ditemukan
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Coba ubah mata kuliah, jadwal, atau gaya belajar.
          </p>
        </div>
      )}
      {(detail || detailLoading) && (
        <BuddyDetailModal
          buddy={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
          onGoGroups={() => router.push('/dashboard/groups')}
        />
      )}
    </div>
  );
}
