"use client";

import {
  CalendarDays,
  Clock3,
  Star,
  Video,
} from "lucide-react";
import { statusLabel, statusClass } from "@/components/tutoring/utils";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function RequestsSection({ ctrl }: { ctrl: TutoringController }) {
  const {
    outgoing,
    saving,
    changeStatus,
    openReview,
  } = ctrl;

  return (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Request Tutoring Saya
                </h2>
              </div>

              {outgoing.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                  Belum ada request tutoring.
                </p>
              ) : (
                <div className="space-y-4">
                  {outgoing.map((row) => (
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
                            Tutor: {row.tutor_name} · {row.subject_name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock3 className="h-3 w-3" />
                            {new Date(row.scheduled_at).toLocaleString(
                              "id-ID"
                            )}{" "}
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
                          {row.notes}
                        </p>
                      )}

                      {(row.status === "accepted" || row.status === "completed") && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Detail Sesi
                          </p>

                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <p>
                              Format:{" "}
                              <strong className="capitalize">
                                {row.session_format || "-"}
                              </strong>
                            </p>

                            {row.session_format === "offline" &&
                              row.location && (
                                <p>Lokasi: {row.location}</p>
                              )}

                            {row.session_notes && (
                              <p>Catatan tutor: {row.session_notes}</p>
                            )}
                          </div>

                          {row.session_format === "online" &&
                            row.meeting_link && (
                              <a
                                href={row.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white"
                              >
                                <Video className="h-3.5 w-3.5" />
                                Buka Meeting
                              </a>
                            )}
                        </div>
                      )}

                      {row.status === "pending" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void changeStatus(row.id, "cancelled")
                          }
                          className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Batalkan Request
                        </button>
                      )}

                      {row.status === "completed" && !row.review_id && (
                        <button
                          type="button"
                          onClick={() => openReview(row)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-amber-600"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Beri Review
                        </button>
                      )}

                      {row.status === "completed" && row.review_id && (
                        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Star className="h-4 w-4 fill-current" />
                            Review Anda: {row.review_rating}/5
                          </div>
                          {row.review_comment && (
                            <p className="mt-1 text-[11px] leading-5 text-slate-600">
                              {row.review_comment}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
  );
}
