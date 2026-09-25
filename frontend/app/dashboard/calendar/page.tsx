'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  UserPlus,
  UsersRound,
  Video,
  X,
} from 'lucide-react';

interface Subject {
  id: number;
  name: string;
}

interface StudyGroup {
  id: number;
  creator_id: number;
  name: string;
  slug?: string;
  subject?: Subject | null;
}

interface StudySession {
  id: number;
  host_id: number;
  study_group_id: number | null;
  subject_id: number | null;
  title: string;
  description?: string | null;
  meeting_link?: string | null;
  max_participants: number;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants_count?: number;
  is_joined?: boolean;
  study_group?: StudyGroup | null;
  subject?: Subject | null;
}

interface SessionForm {
  title: string;
  study_group_id: string;
  date: string;
  time: string;
  duration_minutes: string;
  max_participants: string;
  meeting_link: string;
  description: string;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
).replace(/\/$/, '');

const TOKEN_KEY = 'meetspace_auth_token';

const emptyForm: SessionForm = {
  title: '',
  study_group_id: '',
  date: '',
  time: '',
  duration_minutes: '120',
  max_participants: '5',
  meeting_link: '',
  description: '',
};

function getToken() {
  if (typeof window === 'undefined') return '';

  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('access_token') ||
    ''
  );
}

function getPayload<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

// Backend memakai dateTime tanpa timezone. API saat ini menampilkan suffix Z,
// jadi nilai jam/tanggal dipertahankan sebagai wall-clock WITA agar tidak bergeser.
function splitApiDateTime(value: string) {
  const clean = value.replace(/Z$/, '');
  const [datePart, timePart = '00:00:00'] = clean.split('T');
  return {
    date: datePart,
    time: timePart.split('.')[0].slice(0, 5),
  };
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

function formatIndonesianDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}j ${mins}m` : `${hours} jam`;
}

function getCalendarDays(cursorDate: Date) {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export default function CalendarPage() {
  const todayKey = getDateKey(new Date());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [sessionActionId, setSessionActionId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [cursorDate, setCursorDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SessionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calendarDays = useMemo(() => getCalendarDays(cursorDate), [cursorDate]);

  const creatorGroups = useMemo(
    () =>
      currentUserId
        ? groups.filter((group) => group.creator_id === currentUserId)
        : [],
    [groups, currentUserId],
  );

  const sessionRows = useMemo(
    () => sessions.map((s) => ({ ...s, ...splitApiDateTime(s.scheduled_at) })).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [sessions],
  );

  const upcomingSessions = useMemo(
    () => sessionRows.filter((s) => s.status !== 'cancelled' && s.date >= todayKey).slice(0, 6),
    [sessionRows, todayKey],
  );

  const selectedSessions = sessionRows.filter((s) => s.date === selectedDate && s.status !== 'cancelled');

  const monthSessionCount = sessionRows.filter((s) => s.date.startsWith(`${cursorDate.getFullYear()}-${String(cursorDate.getMonth() + 1).padStart(2, '0')}`)).length;
  const participantTotal = sessions.reduce((sum, s) => sum + (s.participants_count || 0), 0);

  async function fetchData(silent = false) {
    const token = getToken();
    if (!token) {
      setError('Token login tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const [sessionResponse, groupResponse, meResponse] = await Promise.all([
        fetch(`${API_URL}/study-sessions`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/groups`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/me`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      if (
        sessionResponse.status === 401 ||
        groupResponse.status === 401 ||
        meResponse.status === 401
      ) {
        throw new Error('Sesi login sudah berakhir. Silakan login kembali.');
      }

      if (!sessionResponse.ok) {
        throw new Error('Gagal mengambil data sesi belajar.');
      }

      if (!meResponse.ok) {
        throw new Error('Gagal mengambil data pengguna.');
      }

      const [sessionPayload, groupPayload, mePayload] = await Promise.all([
        sessionResponse.json(),
        groupResponse.ok ? groupResponse.json() : Promise.resolve([]),
        meResponse.json(),
      ]);

      setSessions(getPayload<StudySession>(sessionPayload));
      setGroups(getPayload<StudyGroup>(groupPayload));

      const meUser = mePayload?.user ?? mePayload?.data ?? mePayload;
      setCurrentUserId(
        typeof meUser?.id === 'number' ? meUser.id : Number(meUser?.id) || null
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengambil data.'
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreateModal() {
    if (creatorGroups.length === 0) {
      setSuccess('');
      setError(
        'Anda belum menjadi ketua grup. Buat grup terlebih dahulu untuk membuat sesi belajar.'
      );
      return;
    }

    setError('');
    setSuccess('');
    setFormData({
      ...emptyForm,
      study_group_id: String(creatorGroups[0].id),
      date: selectedDate >= todayKey ? selectedDate : todayKey,
      time: '19:00',
    });
    setIsModalOpen(true);
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();
    if (!token) return setError('Token login tidak ditemukan.');
    if (!formData.study_group_id) return setError('Pilih grup belajar terlebih dahulu.');

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          study_group_id: Number(formData.study_group_id),
          title: formData.title,
          description: formData.description || null,
          meeting_link: formData.meeting_link || null,
          max_participants: Number(formData.max_participants),
          scheduled_at: `${formData.date} ${formData.time}:00`,
          duration_minutes: Number(formData.duration_minutes),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const validationMessage = payload?.message || Object.values(payload?.errors || {}).flat().join(' ');
        throw new Error(validationMessage || 'Gagal membuat sesi belajar.');
      }

      setSuccess('Sesi belajar berhasil dibuat.');
      setIsModalOpen(false);
      setFormData(emptyForm);
      await fetchData();
      setSelectedDate(formData.date);
      const [year, month] = formData.date.split('-').map(Number);
      setCursorDate(new Date(year, month - 1, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat sesi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSessionMembership(
    session: StudySession,
    action: 'join' | 'leave'
  ) {
    const token = getToken();

    if (!token) {
      setError('Token login tidak ditemukan. Silakan login kembali.');
      return;
    }

    setSessionActionId(session.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/study-sessions/${session.id}/${action}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            (action === 'join'
              ? 'Gagal bergabung ke sesi.'
              : 'Gagal keluar dari sesi.')
        );
      }

      setSuccess(
        payload?.message ||
          (action === 'join'
            ? 'Berhasil bergabung ke sesi.'
            : 'Berhasil keluar dari sesi.')
      );

      await fetchData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : action === 'join'
            ? 'Terjadi kesalahan saat bergabung ke sesi.'
            : 'Terjadi kesalahan saat keluar dari sesi.'
      );
    } finally {
      setSessionActionId(null);
    }
  }

  function moveMonth(offset: number) {
    setCursorDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function goToday() {
    const now = new Date();
    setCursorDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(getDateKey(now));
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">Study Planner</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">LIVE API</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kalender & Jadwal Belajar</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Atur sesi belajar bersama Study Buddy dan lihat agenda yang benar-benar tersimpan di database.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fetchData()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {creatorGroups.length > 0 && (
              <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Buat Sesi
              </button>
            )}
          </div>
        </div>
      </section>

      {error && <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

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
                <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.85fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-base font-bold text-slate-900">{formatMonthLabel(cursorDate)}</h2><p className="mt-1 text-xs text-slate-500">Pilih tanggal untuk melihat sesi.</p></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={goToday} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Hari ini</button>
              <button type="button" onClick={() => moveMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => moveMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 pb-2">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{day}</div>)}</div>

          {loading ? <div className="flex h-[420px] items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />Memuat kalender...</div> : <div className="grid grid-cols-7 gap-1 pt-2 sm:gap-2">
            {calendarDays.map((date) => {
              const dateKey = getDateKey(date);
              const sameMonth = date.getMonth() === cursorDate.getMonth();
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const daySessions = sessionRows.filter((s) => s.date === dateKey && s.status !== 'cancelled');

              return <button type="button" key={dateKey} onClick={() => setSelectedDate(dateKey)} className={`group min-h-[78px] rounded-xl border p-2 text-left transition sm:min-h-[88px] ${isSelected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'} ${!sameMonth ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'bg-white text-blue-700' : 'text-slate-600'}`}>{date.getDate()}</span>{daySessions.length > 0 && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">{daySessions.length}</span>}</div>
                <div className="mt-2 space-y-1">{daySessions.slice(0, 2).map((s) => <div key={s.id} className="truncate rounded-md bg-white px-1.5 py-1 text-[9px] font-semibold text-slate-600 shadow-sm">{s.time} · {s.title}</div>)}{daySessions.length > 2 && <p className="text-[9px] font-medium text-blue-600">+{daySessions.length - 2} sesi lainnya</p>}</div>
              </button>;
            })}
          </div>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Agenda Dipilih</p><h2 className="mt-1 text-lg font-bold text-slate-900">{formatIndonesianDate(selectedDate)}</h2></div>{creatorGroups.length > 0 && <button type="button" onClick={openCreateModal} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800" title="Buat sesi belajar"><Plus className="h-4 w-4" /></button>}</div>

          {selectedSessions.length === 0 ? <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm"><CalendarDays className="h-6 w-6" /></div><h3 className="mt-4 text-sm font-bold text-slate-700">Belum ada sesi</h3><p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">{creatorGroups.length > 0 ? 'Tanggal ini belum memiliki sesi belajar.' : 'Belum ada sesi dari grup yang Anda ikuti pada tanggal ini.'}</p>{creatorGroups.length > 0 && <button type="button" onClick={openCreateModal} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Buat Sesi Belajar</button>}</div> : <div className="space-y-3">
            {selectedSessions.map((session) => {
              const isHost = currentUserId === session.host_id;
              const isJoined = Boolean(session.is_joined || isHost);
              const isFull =
                (session.participants_count || 0) >= session.max_participants;
              const isProcessing = sessionActionId === session.id;

              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Video className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                          Sesi Belajar
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold capitalize text-emerald-700">
                          {session.status}
                        </span>
                        {isJoined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {isHost ? 'Host' : 'Sudah bergabung'}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-slate-900">
                        {session.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 text-blue-500" />
                          {session.time} WITA · {formatDuration(session.duration_minutes)}
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-3.5 w-3.5 text-emerald-500" />
                          {session.participants_count || 0}/{session.max_participants} peserta
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                          <span className="truncate">
                            {session.subject?.name || 'Mata kuliah'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-amber-500" />
                          <span className="truncate">
                            {session.study_group?.name || 'Grup belajar'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {!isJoined && session.status === 'scheduled' && (
                          <button
                            type="button"
                            onClick={() => handleSessionMembership(session, 'join')}
                            disabled={isProcessing || isFull}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                            {isProcessing
                              ? 'Memproses...'
                              : isFull
                                ? 'Sesi Penuh'
                                : 'Gabung Sesi'}
                          </button>
                        )}

                        {isJoined && session.meeting_link && (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Buka Meeting
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {isJoined &&
                          !isHost &&
                          session.status === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSessionMembership(session, 'leave')
                              }
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <LogOut className="h-3.5 w-3.5" />
                              )}
                              {isProcessing ? 'Memproses...' : 'Keluar Sesi'}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">Upcoming</p><h2 className="mt-1 text-lg font-bold text-slate-900">Sesi Belajar Mendatang</h2><p className="mt-1 text-xs text-slate-400">Data diambil langsung dari database.</p></div>
        {upcomingSessions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Belum ada sesi mendatang.</p></div> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcomingSessions.map((session) => <button type="button" key={session.id} onClick={() => { setSelectedDate(session.date); const [year, month] = session.date.split('-').map(Number); setCursorDate(new Date(year, month - 1, 1)); }} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-blue-50 px-3 py-2 text-center"><p className="text-[9px] font-bold text-blue-600">{session.date.slice(8, 10)}</p><p className="text-[9px] font-semibold uppercase text-slate-500">{session.date.slice(5, 7)}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold capitalize text-emerald-700">{session.status}</span></div><h3 className="mt-4 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-blue-700">{session.title}</h3><p className="mt-1 truncate text-[11px] text-slate-400">{session.study_group?.name || 'Grup belajar'}</p><div className="mt-4 flex items-center gap-4 text-[10px] font-medium text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-blue-500" />{session.time}</span><span className="inline-flex items-center gap-1"><UsersRound className="h-3.5 w-3.5 text-emerald-500" />{session.participants_count || 0}/{session.max_participants}</span></div></button>)}
        </div>}
      </section>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">Create Session</p><h3 className="mt-1 text-lg font-bold text-slate-900">Buat Sesi Belajar</h3></div><button type="button" onClick={() => !saving && setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleCreateSession} className="space-y-4 p-5 sm:p-6">
          <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Judul sesi</label><input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Review Laravel API" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
          <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Grup belajar</label><select required value={formData.study_group_id} onChange={(e) => setFormData({ ...formData, study_group_id: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="">Pilih grup belajar</option>{creatorGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Tanggal</label><input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div><div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Jam (WITA)</label><input required type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Durasi</label><select value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="30">30 menit</option><option value="60">1 jam</option><option value="90">1 jam 30 menit</option><option value="120">2 jam</option><option value="180">3 jam</option></select></div><div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Maks. peserta</label><input required min={2} max={100} type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div></div>
          <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Link meeting</label><input type="url" value={formData.meeting_link} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
          <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Deskripsi</label><textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tuliskan materi atau target belajar..." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button><button type="submit" disabled={saving || creatorGroups.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Menyimpan...' : 'Simpan Sesi'}</button></div>
        </form>
      </div></div>}
    </div>
  );
}
