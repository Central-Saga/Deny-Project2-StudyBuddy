"use client";

import {
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  UserRound,
  Video,
} from "lucide-react";
import { DAYS, timeLabel } from "@/components/tutoring/utils";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function TutorSearchSection({ ctrl }: { ctrl: TutoringController }) {
  const {
    tutors,
    subjects,
    searchLoading,
    subjectFilter,
    setSubjectFilter,
    formatFilter,
    setFormatFilter,
    dayFilter,
    setDayFilter,
    timeFilter,
    setTimeFilter,
    applyTutorFilter,
    resetFilters,
    openRequest,
    openTutorReviews,
  } = ctrl;

  return (
            <div className="space-y-5">
              <form
                onSubmit={applyTutorFilter}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Filter Tutor
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <select
                    value={subjectFilter}
                    onChange={(event) =>
                      setSubjectFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua mata kuliah</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={formatFilter}
                    onChange={(event) =>
                      setFormatFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua format</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>

                  <select
                    value={dayFilter}
                    onChange={(event) =>
                      setDayFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                  >
                    <option value="">Semua hari</option>
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={timeFilter}
                    disabled={dayFilter === ""}
                    onChange={(event) =>
                      setTimeFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 disabled:opacity-50"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Terapkan Filter
                  </button>

                  <button
                    type="button"
                    onClick={() => void resetFilters()}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {searchLoading ? (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
                  Mencari tutor...
                </div>
              ) : tutors.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
                  <h2 className="mt-4 text-base font-bold text-slate-700">
                    Tutor tidak ditemukan
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba perluas filter atau jadilah tutor untuk mata
                    kuliah yang kamu kuasai.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {tutors.map((tutor) => (
                    <article
                      key={tutor.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {tutor.avatar_url ? (
                          <img
                            src={tutor.avatar_url}
                            alt={`Foto ${tutor.name}`}
                            className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-slate-900">
                            {tutor.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-[10px] text-slate-500">
                              {tutor.rating_avg.toFixed(1)} / 5 ·{" "}
                              {tutor.reviews_count} review
                            </p>

                            {tutor.reviews_count > 0 && (
                              <button
                                type="button"
                                onClick={() => void openTutorReviews(tutor)}
                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                Lihat Review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500">
                        {tutor.bio || "Belum ada bio tutor."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tutor.subjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tutor.format_online && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                            <Video className="h-3 w-3" />
                            Online
                          </span>
                        )}

                        {tutor.format_offline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                            <MapPin className="h-3 w-3" />
                            Offline
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-1">
                        {tutor.availability
                          .slice(0, 3)
                          .map((slot, index) => (
                            <p
                              key={`${tutor.id}-${slot.day_of_week}-${index}`}
                              className="flex items-center gap-1 text-[10px] text-slate-400"
                            >
                              <Clock3 className="h-3 w-3" />
                              {DAYS[Number(slot.day_of_week)]},{" "}
                              {timeLabel(slot.start_time)} -{" "}
                              {timeLabel(slot.end_time)}
                            </p>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => openRequest(tutor)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Minta Tutoring
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
  );
}
