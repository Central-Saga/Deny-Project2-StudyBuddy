"use client";

import {
  CircleOff,
  GraduationCap,
  Loader2,
  Settings2,
} from "lucide-react";
import { useTutoringPage } from "@/hooks/tutoring/useTutoringPage";
import TutorSearchSection from "./TutorSearchSection";
import RequestsSection from "./RequestsSection";
import TutorModeSection from "./TutorModeSection";
import RequestTutorModal from "./RequestTutorModal";
import TutorProfileModal from "./TutorProfileModal";
import TutorReviewsModal from "./TutorReviewsModal";
import ReviewModal from "./ReviewModal";
import SessionModal from "./SessionModal";

export default function TutoringClient() {
  const ctrl = useTutoringPage();
  const {
    tab,
    setTab,
    outgoing,
    profile,
    loading,
    error,
    mainLoadError,
    hasLoadedMainData,
    success,
    incomingPendingCount,
    loadMainData,
    openProfile,
    requestTutor,
    profileOpen,
    reviewListTutor,
    reviewRequest,
    sessionRequest,
  } = ctrl;

  return (
    <div className="w-full space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                Peer Tutoring
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Belajar dengan Tutor Sebaya
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Cari bantuan berdasarkan mata kuliah dan jadwal, atau
                aktifkan mode tutor untuk membantu mahasiswa lain.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openProfile}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Settings2 className="h-4 w-4" />
            {profile ? "Kelola Mode Tutor" : "Jadi Tutor"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "search"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Cari Tutor
        </button>

        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "requests"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Request Saya ({outgoing.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("tutor")}
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            tab === "tutor"
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Mode Tutor ({incomingPendingCount})
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {mainLoadError && hasLoadedMainData && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <p className="font-semibold">
            Gagal memperbarui data tutoring.
          </p>
          <p className="mt-1">
            Data sebelumnya masih ditampilkan.
          </p>
          <button
            type="button"
            onClick={() => void loadMainData()}
            className="mt-3 font-semibold underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
          Memuat peer tutoring...
        </div>
      ) : mainLoadError && !hasLoadedMainData ? (
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm"
        >
          <CircleOff className="mx-auto h-10 w-10 text-red-500" />

          <h2 className="mt-4 text-base font-bold text-slate-800">
            Data Peer Tutoring belum dapat dimuat
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {mainLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadMainData()}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {tab === "search" && <TutorSearchSection ctrl={ctrl} />}
          {tab === "requests" && <RequestsSection ctrl={ctrl} />}
          {tab === "tutor" && <TutorModeSection ctrl={ctrl} />}
        </>
      )}

      {requestTutor && <RequestTutorModal ctrl={ctrl} />}
      {profileOpen && <TutorProfileModal ctrl={ctrl} />}
      {reviewListTutor && <TutorReviewsModal ctrl={ctrl} />}
      {reviewRequest && <ReviewModal ctrl={ctrl} />}
      {sessionRequest && <SessionModal ctrl={ctrl} />}
    </div>
  );
}
