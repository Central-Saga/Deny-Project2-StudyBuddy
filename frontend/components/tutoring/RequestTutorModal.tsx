"use client";

import {
  Loader2,
  Send,
  X,
} from "lucide-react";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function RequestTutorModal({ ctrl }: { ctrl: TutoringController }) {
  const {
    saving,
    requestTutor,
    setRequestTutor,
    requestForm,
    setRequestForm,
    submitRequest,
  } = ctrl;

  if (!requestTutor) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Request Tutoring
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Minta sesi dengan {requestTutor.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setRequestTutor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitRequest} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Mata kuliah
                </label>
                <select
                  required
                  value={requestForm.subject_id}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      subject_id: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                >
                  {requestTutor.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Topik
                </label>
                <input
                  required
                  value={requestForm.topic}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      topic: event.target.value,
                    })
                  }
                  placeholder="Contoh: Normalisasi database"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Usulan jadwal
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={requestForm.scheduled_at}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
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
                    value={requestForm.duration_minutes}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
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

              <p className="rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">
                Pilih waktu yang sesuai dengan availability tutor. Tutor
                dapat menyesuaikan detail akhir saat menerima request.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Kebutuhan belajar
                </label>
                <textarea
                  rows={3}
                  value={requestForm.notes}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      notes: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  placeholder="Jelaskan bagian yang ingin dibantu..."
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
                  <Send className="h-4 w-4" />
                )}

                {saving ? "Mengirim..." : "Kirim Request"}
              </button>
            </form>
          </div>
        </div>
  );
}
