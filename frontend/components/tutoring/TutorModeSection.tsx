"use client";

import {
  CheckCircle2,
  CircleOff,
  MessageSquare,
  Pencil,
  Plus,
} from "lucide-react";
import { statusLabel, statusClass } from "@/components/tutoring/utils";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function TutorModeSection({ ctrl }: { ctrl: TutoringController }) {
  const {
    incoming,
    profile,
    saving,
    openProfile,
    toggleTutorStatus,
    changeStatus,
    openSessionModal,
  } = ctrl;

  return (
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Mode Tutor
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Atur profil, mata kuliah, availability, dan status
                      kamu sebagai peer tutor.
                    </p>
                  </div>

                  {!profile ? (
                    <button
                      type="button"
                      onClick={openProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Buat Profil Tutor
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openProfile}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Profil
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleTutorStatus()}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${
                          profile.status === "active"
                            ? "bg-red-600"
                            : "bg-emerald-600"
                        }`}
                      >
                        {profile.status === "active" ? (
                          <CircleOff className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        {profile.status === "active"
                          ? "Nonaktifkan Tutor"
                          : "Aktifkan Tutor"}
                      </button>
                    </div>
                  )}
                </div>

                {profile && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    Status:{" "}
                    <strong
                      className={
                        profile.status === "active"
                          ? "text-emerald-700"
                          : "text-red-600"
                      }
                    >
                      {profile.status === "active"
                        ? "Aktif"
                        : "Nonaktif"}
                    </strong>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Request Masuk
                  </h2>
                </div>

                {incoming.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                    Belum ada request tutoring masuk.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {incoming.map((row) => (
                      <article
                        key={row.id}
                        className="rounded-2xl border border-slate-100 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {row.topic}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Dari: {row.student_name} ·{" "}
                              {row.subject_name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Usulan:{" "}
                              {new Date(
                                row.scheduled_at
                              ).toLocaleString("id-ID")}{" "}
                              · {row.duration_minutes} menit
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                              row.status
                            )}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </div>

                        {row.notes && (
                          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                            Kebutuhan: {row.notes}
                          </p>
                        )}

                        {row.status === "pending" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openSessionModal(row, "accept")
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white"
                            >
                              Terima & Atur Sesi
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void changeStatus(row.id, "rejected")
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        )}

                        {row.status === "accepted" && (
                          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <div className="space-y-1 text-xs text-slate-600">
                              <p>
                                Format:{" "}
                                <strong className="capitalize">
                                  {row.session_format || "-"}
                                </strong>
                              </p>

                              {row.location && (
                                <p>Lokasi: {row.location}</p>
                              )}

                              {row.meeting_link && (
                                <p className="truncate">
                                  Meeting: {row.meeting_link}
                                </p>
                              )}

                              {row.session_notes && (
                                <p>Catatan: {row.session_notes}</p>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openSessionModal(row, "edit")
                                }
                                className="rounded-lg border border-emerald-200 px-3 py-2 text-[10px] font-bold text-emerald-700"
                              >
                                Edit Detail Sesi
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void changeStatus(
                                    row.id,
                                    "completed"
                                  )
                                }
                                className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                              >
                                Tandai Selesai
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
  );
}
