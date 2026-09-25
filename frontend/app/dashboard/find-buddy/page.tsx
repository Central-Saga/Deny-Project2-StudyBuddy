'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ExternalLink,
  Code2,
  GraduationCap,
  Mail,
  Phone,
  School,
  Users,
  Clock3,
  Eye,
  Loader2,
  Search,
  Sparkles,
  Unlink,
  UserPlus,
  X,
} from 'lucide-react';
import {
  getApiPayload,
  isBuddyDto,
  isSubjectDto,
  type BuddyDetailDto,
  type BuddyDto,
  type LearningStyle,
  type SubjectDto,
} from '@/types/api';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

const LEARNING_STYLES: LearningStyle[] = [
  'Visual',
  'Diskusi',
  'Membaca Mandiri',
  'Praktik Soal',
];

type MatchingMode = 'profile' | 'filters' | 'none';

const DAYS = [
  { value: '', label: 'Semua Hari' },
  { value: '0', label: 'Minggu' },
  { value: '1', label: 'Senin' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
];

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }
  return fallback;
}

function getMatchingMode(payload: unknown): MatchingMode {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'matching' in payload &&
    typeof payload.matching === 'object' &&
    payload.matching !== null &&
    'mode' in payload.matching
  ) {
    const mode = payload.matching.mode;
    if (mode === 'profile' || mode === 'filters' || mode === 'none') {
      return mode;
    }
  }

  return 'none';
}

export default function FindBuddyPage() {
  const router = useRouter();

  const [buddies, setBuddies] = useState<BuddyDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBuddyId, setActionBuddyId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [matchingMode, setMatchingMode] = useState<MatchingMode>('none');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedLearningStyles, setSelectedLearningStyles] =
    useState<LearningStyle[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');

  const [detail, setDetail] = useState<BuddyDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    const response = await fetch(`${API_URL}/subjects`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    if (!response.ok) return;
    const payload = await response.json();
    setSubjects(getApiPayload(payload, isSubjectDto));
  }, [router]);

  const fetchBuddies = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (dayOfWeek !== '' && endTime <= startTime) {
        throw new Error('Jam selesai harus setelah jam mulai.');
      }

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      selectedSubjectIds.forEach((id) => {
        params.append('subject_ids[]', String(id));
      });

      selectedLearningStyles.forEach((style) => {
        params.append('learning_styles[]', style);
      });

      if (dayOfWeek !== '') {
        params.set('day_of_week', dayOfWeek);
        params.set('start_time', startTime);
        params.set('end_time', endTime);
      }

      const response = await fetch(
        `${API_URL}/buddies${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      if (response.status === 401) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Gagal mengambil data buddy.'));
      }

      // Laravel Resource pagination mengembalikan { data: [...] }, bukan array langsung.
      setBuddies(getApiPayload(payload, isBuddyDto));
      setMatchingMode(getMatchingMode(payload));
    } catch (error) {
      console.error('Gagal mengambil data buddy:', error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal terhubung ke server backend.'
      );
      setBuddies([]);
    } finally {
      setLoading(false);
    }
  }, [
    dayOfWeek,
    endTime,
    router,
    searchTerm,
    selectedLearningStyles,
    selectedSubjectIds,
    startTime,
  ]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    void fetchSubjects();
  }, [fetchSubjects, router]);

  // Pencarian otomatis: initial load memakai profil login,
  // lalu filter manual mempersempit/mengganti kriteria terkait.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchBuddies();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchBuddies]);

  function toggleSubject(subjectId: number) {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }

  function toggleLearningStyle(style: LearningStyle) {
    setSelectedLearningStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    );
  }

  function resetFilters() {
    setSearchTerm('');
    setSelectedSubjectIds([]);
    setSelectedLearningStyles([]);
    setDayOfWeek('');
    setStartTime('18:00');
    setEndTime('20:00');
    setErrorMsg('');
    // useEffect akan memuat ulang hasil otomatis berdasarkan profil login.
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchBuddies();
  }

  async function connectionRequest(buddyId: number) {
    await runBuddyAction(
      buddyId,
      `${API_URL}/buddies/${buddyId}/connect`,
      'POST'
    );
  }

  async function acceptConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}/accept`,
      'PATCH'
    );
  }

  async function rejectConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}/reject`,
      'PATCH'
    );
  }

  async function removeConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}`,
      'DELETE'
    );
  }

  async function runBuddyAction(
    buddyId: number,
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE'
  ) {
    const token = getStoredToken();
    if (!token) return;

    setActionBuddyId(buddyId);
    setErrorMsg('');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Aksi koneksi gagal.'));
      }

      await fetchBuddies();
      if (detail?.id === buddyId) {
        await openDetail(buddyId);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Aksi koneksi gagal.');
    } finally {
      setActionBuddyId(null);
    }
  }

  async function openDetail(buddyId: number) {
    const token = getStoredToken();
    if (!token) return;

    setDetailLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/buddies/${buddyId}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Gagal memuat profil buddy.'));
      }
      setDetail((payload?.data || null) as BuddyDetailDto | null);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Gagal memuat profil buddy.'
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Cari Study Buddy</h1>
        <p className="mt-1 text-xs text-slate-500">
          Cari partner belajar berdasarkan mata kuliah, jadwal, dan gaya belajar.
        </p>
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs"
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs disabled:opacity-50"
            />
            <input
              type="time"
              value={endTime}
              disabled={dayOfWeek === ''}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs disabled:opacity-50"
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

      {errorMsg && (
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

function BuddyCard({
  buddy,
  busy,
  onView,
  onConnect,
  onAccept,
  onReject,
  onRemove,
  matchingMode,
}: {
  buddy: BuddyDto;
  busy: boolean;
  onView: () => void;
  onConnect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRemove: () => void;
  matchingMode: MatchingMode;
}) {
  const initials = buddy.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
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
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-800">{buddy.name}</h3>
              <p className="truncate text-[11px] text-slate-400">{buddy.email}</p>
            </div>
          </div>
          {matchingMode === 'none' ? (
            <span
              title="Lengkapi profil belajar agar skor Match dapat dihitung."
              className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500"
            >
              Lengkapi profil
            </span>
          ) : (
            <span
              title={
                matchingMode === 'profile'
                  ? 'Dihitung otomatis dari profil belajarmu.'
                  : 'Dihitung dari filter aktif dan profil belajarmu.'
              }
              className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"
            >
              Match {buddy.match_score ?? 0}
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
          {buddy.bio || 'Belum menambahkan bio singkat.'}
        </p>

        {(buddy.matched_subjects || []).length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase text-slate-400">Mata Kuliah Cocok</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {buddy.matched_subjects?.map((subject) => (
                <span
                  key={subject.id}
                  className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700"
                >
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(buddy.learning_styles || []).map((style) => (
            <span
              key={style}
              className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700"
            >
              {style}
            </span>
          ))}
        </div>

        <div className="mt-3 flex gap-2 text-[10px]">
          {buddy.availability_match && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              <Clock3 className="h-3 w-3" /> Jadwal cocok
            </span>
          )}
          {buddy.learning_style_match && (
            <span className="flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 font-semibold text-violet-700">
              <Brain className="h-3 w-3" /> Gaya cocok
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onView}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" /> Lihat Profil
        </button>

        {buddy.connection_status === 'pending' &&
        buddy.connection_direction === 'incoming' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onAccept}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Terima
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Tolak
            </button>
          </div>
        ) : buddy.connection_status === 'pending' ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Batalkan Permintaan
          </button>
        ) : buddy.is_connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
            Terhubung · Putuskan
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onConnect}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Ajak Belajar
          </button>
        )}
      </div>
    </article>
  );
}

function BuddyDetailModal({
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
