'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface NotificationRow {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    [key: string]: unknown;
  };
  read_at?: string | null;
  created_at: string;
}

interface NotificationResponse {
  notifications?: NotificationRow[];
  unread_count?: number;
  message?: string;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

const TOKEN_KEYS = [
  'access_token',
  'meetspace_auth_token',
];

function getToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return '';
}

async function apiFetch(
  path: string,
  init: RequestInit = {}
) {
  const token = getToken();

  return fetch(`${API_URL}${path}`, {
    ...init,

    headers: {
      Accept: 'application/json',

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(init.headers || {}),
    },

    cache: 'no-store',
  });
}

function notifyLayoutUpdate() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new Event(
      'studybuddy:notifications-updated'
    )
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<
    NotificationRow[]
  >([]);

  const [unread, setUnread] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);

  const [
    readingId,
    setReadingId,
  ] = useState<string | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError('');

    try {
      const response =
        await apiFetch('/notifications');

      if (response.status === 401) {
        throw new Error(
          'Sesi login berakhir. Silakan login kembali.'
        );
      }

      const payload: NotificationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal mengambil notifikasi.'
        );
      }

      setItems(
        Array.isArray(
          payload.notifications
        )
          ? payload.notifications
          : []
      );

      setUnread(
        Number(
          payload.unread_count || 0
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat notifikasi.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(
    id: string
  ) {
    /*
     * Hindari request ganda ketika
     * tombol sedang diproses.
     */
    if (readingId === id) {
      return;
    }

    setReadingId(id);

    try {
      const response = await apiFetch(
        `/notifications/${id}/read`,
        {
          method: 'PATCH',
        }
      );

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal menandai notifikasi.'
        );
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                read_at:
                  new Date()
                    .toISOString(),
              }
            : item
        )
      );

      setUnread((current) =>
        Math.max(
          0,
          current - 1
        )
      );

      /*
       * Beri tahu DashboardLayout
       * supaya badge langsung diperbarui.
       */
      notifyLayoutUpdate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menandai notifikasi.'
      );
    } finally {
      setReadingId(null);
    }
  }

  async function markAllRead() {
    if (markingAllRead) {
      return;
    }

    setMarkingAllRead(true);
    setError('');

    try {
      const response =
        await apiFetch(
          '/notifications/read-all',
          {
            method: 'POST',
          }
        );

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal menandai semua notifikasi.'
        );
      }

      const readAt =
        new Date().toISOString();

      setItems((current) =>
        current.map((item) => ({
          ...item,

          read_at:
            item.read_at ||
            readAt,
        }))
      );

      setUnread(0);

      /*
       * Sinkronkan badge header.
       */
      notifyLayoutUpdate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menandai semua notifikasi.'
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
              <Bell className="h-6 w-6" />

              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unread > 99
                    ? '99+'
                    : unread}
                </span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                Notifications
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Notifikasi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Lihat pembaruan dan
                aktivitas terbaru dari
                Study Buddy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                loadNotifications
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

            {unread > 0 && (
              <button
                type="button"
                onClick={
                  markAllRead
                }
                disabled={
                  markingAllRead
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markingAllRead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}

                Tandai semua
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          CONTENT
      ====================================================== */}
      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-500" />

          Memuat notifikasi...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-300" />

          <h2 className="mt-4 text-base font-bold text-slate-700">
            Belum ada notifikasi
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Notifikasi baru akan
            muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isUnread =
              !item.read_at;

            const isReading =
              readingId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition ${
                  isUnread
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isUnread
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-bold text-slate-800">
                        {item.data
                          ?.title ||
                          'Notifikasi'}
                      </h3>

                      <span className="shrink-0 text-[10px] text-slate-400">
                        {new Date(
                          item.created_at
                        ).toLocaleString(
                          'id-ID'
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.data
                        ?.message ||
                        'Ada pembaruan baru.'}
                    </p>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() =>
                          markRead(
                            item.id
                          )
                        }
                        disabled={
                          isReading
                        }
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isReading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}

                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}