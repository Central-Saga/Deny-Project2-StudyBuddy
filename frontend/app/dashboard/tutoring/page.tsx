'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Star,
  UserRound,
  X,
} from 'lucide-react';

interface Subject { id: number; name: string; code?: string; }
interface TutorSubject extends Subject { proficiency_level: string; }
interface Tutor {
  id: number;
  name: string;
  bio?: string | null;
  hourly_rate: number;
  is_verified: boolean;
  rating_avg: number;
  reviews_count: number;
  subjects: TutorSubject[];
}
interface TutoringRequestRow {
  id: number;
  topic: string;
  notes?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link?: string | null;
  subject_name?: string;
  tutor_name?: string;
  student_name?: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEYS = ['meetspace_auth_token', 'access_token'];

function getToken() {
  if (typeof window === 'undefined') return '';
  for (const key of TOKEN_KEYS) { const value = localStorage.getItem(key); if (value) return value; }
  return '';
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) },
  });
}

function defaultDateTime() {
  const d = new Date(Date.now() + 86400000);
  d.setHours(19, 0, 0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TutoringPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [outgoing, setOutgoing] = useState<TutoringRequestRow[]>([]);
  const [incoming, setIncoming] = useState<TutoringRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestTutor, setRequestTutor] = useState<Tutor | null>(null);
  const [requestForm, setRequestForm] = useState({ subject_id: '', topic: '', notes: '', scheduled_at: defaultDateTime(), duration_minutes: '60' });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: '', hourly_rate: '0', subject_ids: [] as number[] });
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [tutorsResponse, subjectsResponse, requestResponse, profileResponse] = await Promise.all([
        apiFetch('/tutoring/tutors'),
        apiFetch('/subjects'),
        apiFetch('/tutoring/requests'),
        apiFetch('/tutoring/profile/me'),
      ]);
      if (tutorsResponse.status === 401) throw new Error('Sesi login berakhir. Silakan login kembali.');
      const tutorPayload = tutorsResponse.ok ? await tutorsResponse.json() : [];
      const subjectPayload = subjectsResponse.ok ? await subjectsResponse.json() : [];
      const requestPayload = requestResponse.ok ? await requestResponse.json() : { outgoing: [], incoming: [] };
      const profilePayload = profileResponse.ok ? await profileResponse.json() : null;
      setTutors(Array.isArray(tutorPayload) ? tutorPayload : tutorPayload?.data || []);
      setSubjects(Array.isArray(subjectPayload) ? subjectPayload : subjectPayload?.data || []);
      setOutgoing(requestPayload?.outgoing || []);
      setIncoming(requestPayload?.incoming || []);
      if (profilePayload) setProfileForm({ bio: profilePayload.bio || '', hourly_rate: String(profilePayload.hourly_rate ?? 0), subject_ids: (profilePayload.subject_ids || []).map(Number) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat tutoring.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function openRequest(tutor: Tutor) {
    setRequestTutor(tutor);
    setRequestForm({ subject_id: tutor.subjects[0] ? String(tutor.subjects[0].id) : '', topic: '', notes: '', scheduled_at: defaultDateTime(), duration_minutes: '60' });
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestTutor) return;
    setSaving(true); setError('');
    try {
      const response = await apiFetch('/tutoring/requests', { method: 'POST', body: JSON.stringify({ tutor_profile_id: requestTutor.id, subject_id: Number(requestForm.subject_id), topic: requestForm.topic, notes: requestForm.notes || null, scheduled_at: requestForm.scheduled_at, duration_minutes: Number(requestForm.duration_minutes) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Gagal mengirim permintaan tutoring.');
      setRequestTutor(null);
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal mengirim permintaan.'); }
    finally { setSaving(false); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await apiFetch('/tutoring/profile', { method: 'POST', body: JSON.stringify({ bio: profileForm.bio || null, hourly_rate: Number(profileForm.hourly_rate) || 0, subject_ids: profileForm.subject_ids }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Gagal menyimpan profil tutor.');
      setProfileOpen(false);
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.'); }
    finally { setSaving(false); }
  }

  async function changeStatus(id: number, status: 'accepted' | 'rejected' | 'completed' | 'cancelled') {
    try {
      const response = await apiFetch(`/tutoring/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Gagal memperbarui status.');
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memperbarui status.'); }
  }

  function statusClass(status: string) {
    if (status === 'accepted' || status === 'completed') return 'bg-emerald-50 text-emerald-700';
    if (status === 'rejected' || status === 'cancelled') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"><GraduationCap className="h-6 w-6" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">Peer Tutoring</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Cari Tutor Sebaya</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Temukan teman yang punya keahlian di mata kuliahmu dan ajukan sesi belajar.</p></div></div>
          <button type="button" onClick={() => setProfileOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Jadi Tutor</button>
        </div>
      </section>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />Memuat tutor...</div> : tutors.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 text-base font-bold text-slate-700">Belum ada tutor aktif</h2><p className="mt-1 text-sm text-slate-400">Jadilah tutor pertama dengan tombol “Jadi Tutor”.</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{tutors.map((tutor) => <div key={tutor.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-base font-bold text-slate-900">{tutor.name}</h3><div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {tutor.rating_avg.toFixed(1)} ({tutor.reviews_count}) {tutor.is_verified && <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Terverifikasi</span>}</div></div></div><p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500">{tutor.bio || 'Belum ada bio tutor.'}</p><div className="mt-4 flex flex-wrap gap-2">{tutor.subjects.map((subject) => <span key={subject.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{subject.name}</span>)}</div><div className="mt-5 flex items-center justify-between gap-3"><div className="text-[10px] font-bold text-slate-500">{tutor.hourly_rate > 0 ? `Rp ${tutor.hourly_rate.toLocaleString('id-ID')} / sesi` : 'Gratis / sukarela'}</div><button type="button" onClick={() => openRequest(tutor)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-bold text-white hover:bg-emerald-700"><MessageSquare className="h-3.5 w-3.5" /> Minta Sesi</button></div></div>)}</div>}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-bold text-slate-900">Permintaan Saya</h2></div>{outgoing.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-400">Belum ada permintaan tutoring.</p> : <div className="space-y-3">{outgoing.map((row) => <div key={row.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">{row.topic}</p><p className="mt-1 text-[10px] text-slate-500">Tutor: {row.tutor_name} · {row.subject_name}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="h-3 w-3" /> {new Date(row.scheduled_at).toLocaleString('id-ID')}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusClass(row.status)}`}>{row.status}</span></div>{row.status === 'pending' && <button type="button" onClick={() => changeStatus(row.id, 'cancelled')} className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50">Batalkan</button>}{row.meeting_link && <a href={row.meeting_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white">Buka Meeting</a>}</div>)}</div>}</div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">Permintaan Masuk</h2></div>{incoming.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-400">Belum ada permintaan masuk.</p> : <div className="space-y-3">{incoming.map((row) => <div key={row.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-800">{row.topic}</p><p className="mt-1 text-[10px] text-slate-500">Dari: {row.student_name} · {row.subject_name}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(row.scheduled_at).toLocaleString('id-ID')} · {row.duration_minutes} menit</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusClass(row.status)}`}>{row.status}</span></div>{row.status === 'pending' && <div className="mt-3 flex gap-2"><button type="button" onClick={() => changeStatus(row.id, 'accepted')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white">Terima</button><button type="button" onClick={() => changeStatus(row.id, 'rejected')} className="rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-600">Tolak</button></div>}{row.status === 'accepted' && <button type="button" onClick={() => changeStatus(row.id, 'completed')} className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white">Tandai selesai</button>}</div>)}</div>}</div>
      </section>

      {requestTutor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">Request Tutoring</p><h2 className="mt-1 text-lg font-bold text-slate-900">Minta sesi dengan {requestTutor.name}</h2></div><button type="button" onClick={() => setRequestTutor(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={submitRequest} className="space-y-4 p-5"><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Mata kuliah</label><select required value={requestForm.subject_id} onChange={(e) => setRequestForm({ ...requestForm, subject_id: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">{requestTutor.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Topik</label><input required value={requestForm.topic} onChange={(e) => setRequestForm({ ...requestForm, topic: e.target.value })} placeholder="Contoh: Normalisasi database" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Jadwal</label><input required type="datetime-local" value={requestForm.scheduled_at} onChange={(e) => setRequestForm({ ...requestForm, scheduled_at: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Durasi</label><select value={requestForm.duration_minutes} onChange={(e) => setRequestForm({ ...requestForm, duration_minutes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"><option value="30">30 menit</option><option value="60">60 menit</option><option value="90">90 menit</option><option value="120">120 menit</option></select></div></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Catatan</label><textarea rows={3} value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" placeholder="Tambahan kebutuhan belajar..." /></div><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-60"><Send className="h-4 w-4" /> {saving ? 'Mengirim...' : 'Kirim Permintaan'}</button></form></div></div>}

      {profileOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">Tutor Profile</p><h2 className="mt-1 text-lg font-bold text-slate-900">Profil Tutor Saya</h2></div><button type="button" onClick={() => setProfileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={saveProfile} className="space-y-4 p-5"><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Bio</label><textarea rows={4} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" placeholder="Jelaskan keahlian dan pengalaman belajar..." /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Tarif per sesi</label><input type="number" min="0" value={profileForm.hourly_rate} onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Mata kuliah yang diajarkan</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{subjects.map((subject) => <label key={subject.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs"><input type="checkbox" checked={profileForm.subject_ids.includes(subject.id)} onChange={(e) => setProfileForm((prev) => ({ ...prev, subject_ids: e.target.checked ? [...prev.subject_ids, subject.id] : prev.subject_ids.filter((id) => id !== subject.id) }))} className="accent-emerald-600" />{subject.name}</label>)}</div></div><button type="submit" disabled={saving || profileForm.subject_ids.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Profil Tutor'}</button></form></div></div>}
    </div>
  );
}
