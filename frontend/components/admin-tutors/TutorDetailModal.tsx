import { BadgeCheck, BookOpen, CalendarClock, Laptop, Loader2, MapPin, Star, Users, X, XCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { formatDateTime, formatTime, getInitials, getDayName, getProficiencyLabel } from '@/components/admin-tutors/utils';
import { InfoCard, InfoMetric, RequestMetric } from '@/components/admin-tutors/TutorMetrics';
import type { TutorListItem, TutorDetail } from '@/components/admin-tutors/types';

export default function TutorDetailModal({
  selectedTutor,
  setSelectedTutor,
  detailLoading,
  setVerifyTarget,
  verificationLoading,
}: {
  selectedTutor: TutorDetail;
  setSelectedTutor: Dispatch<SetStateAction<TutorDetail | null>>;
  detailLoading: boolean;
  setVerifyTarget: Dispatch<SetStateAction<TutorListItem | TutorDetail | null>>;
  verificationLoading: boolean;
}) {
  return (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !detailLoading &&
            !verificationLoading
          ) {
            setSelectedTutor(null);
          }
        }}
      >
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                Tutor Detail
              </p>
              <h2 className="mt-1 !text-slate-950 text-xl font-bold">
                {selectedTutor.name}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {selectedTutor.email}
              </p>
            </div>
  
            <button
              type="button"
              disabled={
                detailLoading ||
                verificationLoading
              }
              onClick={() =>
                setSelectedTutor(null)
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
  
          {detailLoading ? (
            <div className="flex min-h-[380px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Memuat detail tutor...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-6">
              <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white">
                      {getInitials(
                        selectedTutor.name
                      )}
                    </div>
  
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="!text-slate-950 text-base font-bold">
                          {selectedTutor.name}
                        </h3>
  
                        {selectedTutor.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            Belum Verified
                          </span>
                        )}
                      </div>
  
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedTutor.bio ||
                          'Tutor belum menambahkan bio.'}
                      </p>
                    </div>
                  </div>
  
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                      label="Universitas"
                      value={
                        selectedTutor.profile
                          ?.university ||
                        selectedTutor.university ||
                        '-'
                      }
                    />
                    <InfoCard
                      label="Jurusan"
                      value={
                        selectedTutor.profile?.major ||
                        selectedTutor.major ||
                        '-'
                      }
                    />
                    <InfoCard
                      label="Email"
                      value={selectedTutor.email}
                    />
                    <InfoCard
                      label="Telepon"
                      value={
                        selectedTutor.profile
                          ?.phone_number || '-'
                      }
                    />
                  </div>
                </div>
  
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tutor Performance
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <InfoMetric
                        icon={
                          <Star className="h-4 w-4" />
                        }
                        label="Rating"
                        value={Number(
                          selectedTutor.rating_avg ||
                            0
                        ).toFixed(1)}
                      />
                      <InfoMetric
                        icon={
                          <Users className="h-4 w-4" />
                        }
                        label="Reviews"
                        value={String(
                          selectedTutor.reviews_count
                        )}
                      />
                    </div>
                  </div>
  
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Format Tutoring
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTutor.format_online && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                          <Laptop className="h-3.5 w-3.5" />
                          Online
                        </span>
                      )}
                      {selectedTutor.format_offline && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                          <MapPin className="h-3.5 w-3.5" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
  
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Mata Kuliah
                    </h3>
                  </div>
  
                  <div className="mt-4 space-y-2">
                    {selectedTutor.subjects.length ===
                    0 ? (
                      <p className="text-xs text-slate-400">
                        Belum ada mata kuliah.
                      </p>
                    ) : (
                      selectedTutor.subjects.map(
                        (subject) => (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                {subject.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {subject.code ||
                                  'Tanpa kode'}
                              </p>
                            </div>
                            <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                              {getProficiencyLabel(
                                subject.proficiency_level
                              )}
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
  
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Availability
                    </h3>
                  </div>
  
                  <div className="mt-4 space-y-2">
                    {selectedTutor.availability?.length ===
                    0 ? (
                      <p className="text-xs text-slate-400">
                        Belum ada jadwal availability.
                      </p>
                    ) : (
                      selectedTutor.availability?.map(
                        (slot, index) => (
                          <div
                            key={
                              slot.id ??
                              `${slot.day_of_week}-${index}`
                            }
                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                          >
                            <p className="text-xs font-bold text-slate-700">
                              {getDayName(
                                Number(
                                  slot.day_of_week
                                )
                              )}
                            </p>
                            <span className="text-xs font-semibold text-slate-500">
                              {formatTime(
                                slot.start_time
                              )}{' '}
                              –{' '}
                              {formatTime(
                                slot.end_time
                              )}
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </section>
  
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RequestMetric
                  label="Pending"
                  value={
                    selectedTutor.requests?.pending ??
                    0
                  }
                />
                <RequestMetric
                  label="Accepted"
                  value={
                    selectedTutor.requests?.accepted ??
                    0
                  }
                />
                <RequestMetric
                  label="Completed"
                  value={
                    selectedTutor.requests?.completed ??
                    0
                  }
                />
                <RequestMetric
                  label="Cancelled"
                  value={
                    selectedTutor.requests
                      ?.cancelled ?? 0
                  }
                />
              </section>
  
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Verification Record
                    </p>
  
                    {selectedTutor.is_verified ? (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-emerald-700">
                          Tutor sudah diverifikasi.
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {selectedTutor.verifier
                            ?.name ||
                            selectedTutor.verifier_name ||
                            'Administrator'}{' '}
                          ·{' '}
                          {formatDateTime(
                            selectedTutor.verified_at
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Tutor belum diverifikasi oleh administrator.
                      </p>
                    )}
                  </div>
  
                  <button
                    type="button"
                    onClick={() =>
                      setVerifyTarget(
                        selectedTutor
                      )
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                      selectedTutor.is_verified
                        ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedTutor.is_verified ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Batalkan Verifikasi
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="h-4 w-4" />
                        Verify Tutor
                      </>
                    )}
                  </button>
                </div>
  
                {selectedTutor.account_status ===
                  'suspended' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                    Akun pengguna sedang suspended. Verifikasi tutor tidak otomatis mengaktifkan kembali akun pengguna.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
  );
}
