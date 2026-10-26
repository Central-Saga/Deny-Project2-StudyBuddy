'use client';

import { AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useAdminTutors } from '@/hooks/admin-tutors/useAdminTutors';
import TutorsHeader from '@/components/admin-tutors/TutorsHeader';
import TutorSummaryCards from '@/components/admin-tutors/TutorSummaryCards';
import TutorFilters from '@/components/admin-tutors/TutorFilters';
import TutorTable from '@/components/admin-tutors/TutorTable';
import TutorDetailModal from '@/components/admin-tutors/TutorDetailModal';
import TutorVerifyModal from '@/components/admin-tutors/TutorVerifyModal';

export default function AdminTutorsClient() {
  const {
    tutors,
    loading,
    error,
    setError,
    tutorsLoadError,
    success,
    setSuccess,
    searchQuery,
    setSearchQuery,
    verificationFilter,
    setVerificationFilter,
    statusFilter,
    setStatusFilter,
    selectedTutor,
    setSelectedTutor,
    detailLoading,
    verifyTarget,
    setVerifyTarget,
    verificationLoading,
    summary,
    filteredTutors,
    openDetail,
    updateVerification,
    loadTutors,
  } = useAdminTutors();

  if (!loading && tutorsLoadError) {
    return (
      <div
        role="alert"
        className="flex min-h-[420px] items-center justify-center p-6"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Daftar tutor belum dapat dimuat
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {tutorsLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadTutors()}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <TutorsHeader loading={loading} loadTutors={loadTutors} />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess('')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <TutorSummaryCards summary={summary} />

      <TutorFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        verificationFilter={verificationFilter}
        setVerificationFilter={setVerificationFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <TutorTable
        tutors={tutors}
        loading={loading}
        filteredTutors={filteredTutors}
        openDetail={openDetail}
      />

      {selectedTutor && (
        <TutorDetailModal
          selectedTutor={selectedTutor}
          setSelectedTutor={setSelectedTutor}
          detailLoading={detailLoading}
          setVerifyTarget={setVerifyTarget}
          verificationLoading={verificationLoading}
        />
      )}

      {verifyTarget && (
        <TutorVerifyModal
          verifyTarget={verifyTarget}
          setVerifyTarget={setVerifyTarget}
          verificationLoading={verificationLoading}
          updateVerification={updateVerification}
        />
      )}
    </div>
  );
}
