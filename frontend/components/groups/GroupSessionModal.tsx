import {
  AlertCircle,
  CalendarClock,
  Loader2,
  Link2,
  X,
} from 'lucide-react';
import {
  ModalOverlay,
} from './parts';
import { getLocalDateValue } from './utils';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'showSessionModal'
  | 'setShowSessionModal'
  | 'sessionGroup'
  | 'setSessionGroup'
  | 'sessionForm'
  | 'setSessionForm'
  | 'savingSession'
  | 'sessionError'
  | 'setSessionError'
  | 'handleCreateSession'
>;

export default function GroupSessionModal({
  showSessionModal,
  setShowSessionModal,
  sessionGroup,
  setSessionGroup,
  sessionForm,
  setSessionForm,
  savingSession,
  sessionError,
  setSessionError,
  handleCreateSession,
}: Props) {
  return (
    <>
      {showSessionModal && sessionGroup && (
        <ModalOverlay>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Buat Sesi Belajar
                    </h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Grup: {sessionGroup.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSessionModal(false);
                  setSessionGroup(null);
                  setSessionError(null);
                }}
                disabled={savingSession}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 p-5 sm:p-6">
              {sessionError && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{sessionError}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Judul Sesi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Belajar Laravel Routing"
                  disabled={savingSession}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Deskripsi
                </label>
                <textarea
                  value={sessionForm.description}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Topik atau agenda yang akan dibahas..."
                  rows={3}
                  disabled={savingSession}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Link Google Meet / Zoom
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={sessionForm.meeting_link}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        meeting_link: event.target.value,
                      }))
                    }
                    placeholder="https://meet.google.com/..."
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={getLocalDateValue()}
                    value={sessionForm.date}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Jam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Maks. Peserta
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={sessionForm.max_participants}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        max_participants: Number(event.target.value),
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={sessionForm.duration_minutes}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        duration_minutes: Number(event.target.value),
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-3 text-[10px] leading-5 text-blue-700">
                Hanya ketua grup yang dapat membuat sesi. Setelah dibuat, sesi dapat dilihat anggota aktif melalui menu Kalender.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    setSessionGroup(null);
                    setSessionError(null);
                  }}
                  disabled={savingSession}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSession ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}
                  {savingSession ? 'Menyimpan...' : 'Buat Sesi'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
