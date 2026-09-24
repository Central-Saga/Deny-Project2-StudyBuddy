'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Loader2, RefreshCw } from 'lucide-react';

interface NotificationRow {
  id: string;
  type: string;
  data: { title?: string; message?: string; [key: string]: unknown };
  read_at?: string | null;
  created_at: string;
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
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) },
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setLoading(true); setError('');
    try {
      const response = await apiFetch('/notifications');
      if (response.status === 401) throw new Error('Sesi login berakhir. Silakan login kembali.');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Gagal mengambil notifikasi.');
      setItems(payload.notifications || []);
      setUnread(payload.unread_count || 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memuat notifikasi.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadNotifications(); }, []);

  async function markRead(id: string) {
    try {
      const response = await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      if (!response.ok) return;
      setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
      setUnread((current) => Math.max(0, current - 1));
    } catch { /* noop */ }
  }

  async function markAllRead() {
    try {
      const response = await apiFetch('/notifications/read-all', { method: 'POST' });
      if (!response.ok) return;
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      setUnread(0);
    } catch { /* noop */ }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100"><Bell className="h-6 w-6" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}</div><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">Notifications</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Notifikasi</h1><p className="mt-1 text-sm text-slate-500">Lihat pembaruan dan aktivitas terbaru dari Study Buddy.</p></div></div><div className="flex gap-2"><button type="button" onClick={loadNotifications} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>{unread > 0 && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"><CheckCheck className="h-4 w-4" /> Tandai semua</button>}</div></div>
      </section>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-500" />Memuat notifikasi...</div> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><Bell className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 text-base font-bold text-slate-700">Belum ada notifikasi</h2><p className="mt-1 text-sm text-slate-400">Notifikasi baru akan muncul di sini.</p></div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className={`rounded-2xl border p-4 transition ${item.read_at ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/50'}`}><div className="flex items-start gap-3"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.read_at ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h3 className="text-sm font-bold text-slate-800">{item.data?.title || 'Notifikasi'}</h3><span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString('id-ID')}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{item.data?.message || 'Ada pembaruan baru.'}</p>{!item.read_at && <button type="button" onClick={() => markRead(item.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-blue-100"><Check className="h-3.5 w-3.5" /> Tandai dibaca</button>}</div></div></div>)}</div>}
    </div>
  );
}
