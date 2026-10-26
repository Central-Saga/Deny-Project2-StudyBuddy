"use client";

import {
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function SessionModal({ ctrl }: { ctrl: TutoringController }) {
  const {
    profile,
    saving,
    sessionRequest,
    setSessionRequest,
    sessionMode,
    sessionForm,
    setSessionForm,
    submitSession,
  } = ctrl;

  if (!sessionRequest) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Detail Sesi
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {sessionMode === "accept"
                    ? "Terima & Atur Sesi"
                    : "Edit Detail Sesi"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSessionRequest(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitSession} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Jadwal sesi
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={sessionForm.scheduled_at}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        scheduled_at: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Durasi
                  </label>
                  <select
                    value={sessionForm.duration_minutes}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        duration_minutes: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  >
                    <option value="30">30 menit</option>
                    <option value="60">60 menit</option>
                    <option value="90">90 menit</option>
                    <option value="120">120 menit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Format sesi
                </label>
                <select
                  value={sessionForm.session_format}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      session_format: event.target.value as
                        | "online"
                        | "offline",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                >
                  {profile?.format_online && (
                    <option value="online">Online</option>
                  )}
                  {profile?.format_offline && (
                    <option value="offline">Offline</option>
                  )}
                </select>
              </div>

              {sessionForm.session_format === "online" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Meeting link
                  </label>
                  <input
                    required
                    type="url"
                    value={sessionForm.meeting_link}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        meeting_link: event.target.value,
                      })
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Lokasi
                  </label>
                  <input
                    required
                    value={sessionForm.location}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        location: event.target.value,
                      })
                    }
                    placeholder="Contoh: Perpustakaan Kampus"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Catatan tutor
                </label>
                <textarea
                  rows={3}
                  value={sessionForm.session_notes}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      session_notes: event.target.value,
                    })
                  }
                  placeholder="Contoh: Siapkan project atau materi yang ingin dibahas."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {saving
                  ? "Menyimpan..."
                  : sessionMode === "accept"
                    ? "Terima Request"
                    : "Simpan Detail Sesi"}
              </button>
            </form>
          </div>
        </div>
  );
}
