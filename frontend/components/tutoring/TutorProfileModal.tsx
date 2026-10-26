"use client";

import {
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Video,
  X,
} from "lucide-react";
import { DAYS, emptyAvailability } from "@/components/tutoring/utils";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function TutorProfileModal({ ctrl }: { ctrl: TutoringController }) {
  const {
    subjects,
    profile,
    saving,
    setProfileOpen,
    profileForm,
    setProfileForm,
    updateAvailability,
    removeAvailability,
    saveProfile,
  } = ctrl;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Tutor Profile
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {profile ? "Edit Profil Tutor" : "Aktifkan Mode Tutor"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Bio / keahlian
                </label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      bio: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                  placeholder="Contoh: Saya dapat membantu Laravel, routing, dan REST API."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Format tutoring
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={profileForm.format_online}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          format_online: event.target.checked,
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <Video className="h-4 w-4" />
                    Online
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={profileForm.format_offline}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          format_offline: event.target.checked,
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <MapPin className="h-4 w-4" />
                    Offline
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Mata kuliah yang ditawarkan
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={profileForm.subject_ids.includes(
                          subject.id
                        )}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            subject_ids: event.target.checked
                              ? [
                                  ...previous.subject_ids,
                                  subject.id,
                                ]
                              : previous.subject_ids.filter(
                                  (id) => id !== subject.id
                                ),
                          }))
                        }
                        className="accent-emerald-600"
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-slate-600">
                    Availability mingguan
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((previous) => ({
                        ...previous,
                        availability: [
                          ...previous.availability,
                          emptyAvailability(),
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah Jadwal
                  </button>
                </div>

                <div className="space-y-2">
                  {profileForm.availability.map((slot, index) => (
                    <div
                      key={`${slot.id ?? "new"}-${index}`}
                      className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <select
                        value={slot.day_of_week}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "day_of_week",
                            Number(event.target.value)
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      >
                        {DAYS.map((day, dayIndex) => (
                          <option key={day} value={dayIndex}>
                            {day}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "start_time",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      />

                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(event) =>
                          updateAvailability(
                            index,
                            "end_time",
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700"
                      />

                      <button
                        type="button"
                        disabled={
                          profileForm.availability.length === 1
                        }
                        onClick={() =>
                          removeAvailability(index)
                        }
                        className="flex h-10 items-center justify-center rounded-xl border border-red-100 px-3 text-red-500 disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-700">
                Phase 2 belum menggunakan pembayaran. Profil tutor
                digunakan untuk bantuan peer-to-peer.
              </p>

              <button
                type="submit"
                disabled={
                  saving ||
                  profileForm.subject_ids.length === 0 ||
                  profileForm.availability.length === 0 ||
                  (!profileForm.format_online &&
                    !profileForm.format_offline)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {saving ? "Menyimpan..." : "Simpan Profil Tutor"}
              </button>
            </form>
          </div>
        </div>
  );
}
