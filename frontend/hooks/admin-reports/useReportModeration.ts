import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type {
  MaterialReport,
  RemoveTarget,
  ReportStatus,
  RestoreTarget,
  UpdateTarget,
} from '@/components/admin-reports/types';
import {
  clearAuthStorage,
  getStoredToken,
} from '@/components/admin-reports/utils';

interface UseReportModerationOptions {
  handleUnauthorized: (status: number) => boolean;
  loadReports: () => Promise<void>;
  setReports: Dispatch<SetStateAction<MaterialReport[]>>;
  setSelectedReport: Dispatch<SetStateAction<MaterialReport | null>>;
  setError: Dispatch<SetStateAction<string>>;
  setSuccess: Dispatch<SetStateAction<string>>;
}

export function useReportModeration({
  handleUnauthorized,
  loadReports,
  setReports,
  setSelectedReport,
  setError,
  setSuccess,
}: UseReportModerationOptions) {
  const router = useRouter();

  const [updateTarget, setUpdateTarget] =
    useState<UpdateTarget | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const [removeTarget, setRemoveTarget] =
    useState<RemoveTarget | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const [restoreTarget, setRestoreTarget] =
    useState<RestoreTarget | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const openUpdateModal = (
    report: MaterialReport,
    status?: ReportStatus
  ) => {
    setSuccess('');
    setError('');
    setUpdateError('');

    setUpdateTarget({
      report,
      status: status || report.status,
      resolutionNote: report.resolution_note || '',
    });
  };

  const updateReportStatus = async () => {
    if (!updateTarget) {
      return;
    }

    const note = updateTarget.resolutionNote.trim();

    if (
      (updateTarget.status === 'dismissed' ||
        updateTarget.status === 'action_taken') &&
      note.length < 10
    ) {
      setUpdateError(
        'Catatan penyelesaian minimal 10 karakter untuk status Dismissed atau Action Taken.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setUpdateLoading(true);
    setUpdateError('');
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports/${updateTarget.report.id}`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: updateTarget.status,
            resolution_note: note || null,
          }),
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstValidationError = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : null;

        throw new Error(
          String(
            firstValidationError ||
              payload?.message ||
              'Gagal memperbarui status laporan.'
          )
        );
      }

      const updatedReport = payload?.data as
        | MaterialReport
        | undefined;

      if (updatedReport) {
        setReports((current) =>
          current.map((report) =>
            report.id === updatedReport.id
              ? updatedReport
              : report
          )
        );

        setSelectedReport((current) =>
          current?.id === updatedReport.id
            ? updatedReport
            : current
        );
      }

      setSuccess(
        payload?.message ||
          'Status laporan berhasil diperbarui.'
      );
      setUpdateTarget(null);

      await loadReports();
    } catch (caughtError: unknown) {
      setUpdateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Terjadi kesalahan saat memperbarui laporan.'
      );
    } finally {
      setUpdateLoading(false);
    }
  };
  const openRemoveModal = (report: MaterialReport) => {
    setRemoveError('');
    setSuccess('');
    setError('');
    setRemoveTarget({
      report,
      resolutionNote:
        report.resolution_note ||
        'Material dinonaktifkan sementara setelah ditinjau karena memerlukan tindakan moderasi.',
    });
  };

  const removeMaterial = async () => {
    if (!removeTarget) {
      return;
    }

    const note = removeTarget.resolutionNote.trim();

    if (note.length < 10) {
      setRemoveError(
        'Catatan tindakan minimal 10 karakter.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setRemoveLoading(true);
    setRemoveError('');
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports/${removeTarget.report.id}/remove-material`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resolution_note: note,
          }),
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstValidationError = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : null;

        throw new Error(
          String(
            firstValidationError ||
              payload?.message ||
              'Gagal menonaktifkan material.'
          )
        );
      }

      const updatedReport = payload?.data as
        | MaterialReport
        | undefined;

      if (updatedReport) {
        setSelectedReport(updatedReport);
      }

      setRemoveTarget(null);
      setSuccess(
        payload?.message ||
          'Material berhasil dinonaktifkan dan dapat dipulihkan kembali.'
      );

      await loadReports();
    } catch (caughtError: unknown) {
      setRemoveError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Terjadi kesalahan saat menonaktifkan material.'
      );
    } finally {
      setRemoveLoading(false);
    }
  };

  const openRestoreModal = (report: MaterialReport) => {
    setRestoreError('');
    setSuccess('');
    setError('');
    setRestoreTarget({
      report,
      resolutionNote:
        'Material dipulihkan setelah peninjauan ulang oleh administrator.',
    });
  };

  const restoreMaterial = async () => {
    if (!restoreTarget) {
      return;
    }

    const note = restoreTarget.resolutionNote.trim();

    if (note.length < 10) {
      setRestoreError(
        'Catatan pemulihan minimal 10 karakter.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setRestoreLoading(true);
    setRestoreError('');
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports/${restoreTarget.report.id}/restore-material`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resolution_note: note,
          }),
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstValidationError = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : null;

        throw new Error(
          String(
            firstValidationError ||
              payload?.message ||
              'Gagal memulihkan material.'
          )
        );
      }

      const updatedReport = payload?.data as
        | MaterialReport
        | undefined;

      if (updatedReport) {
        setSelectedReport(updatedReport);
      }

      setRestoreTarget(null);
      setSuccess(
        payload?.message ||
          'Material berhasil dipulihkan.'
      );

      await loadReports();
    } catch (caughtError: unknown) {
      setRestoreError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Terjadi kesalahan saat memulihkan material.'
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  return {
    updateTarget,
    setUpdateTarget,
    updateLoading,
    updateError,
    setUpdateError,
    removeTarget,
    setRemoveTarget,
    removeLoading,
    removeError,
    setRemoveError,
    restoreTarget,
    setRestoreTarget,
    restoreLoading,
    restoreError,
    setRestoreError,
    openUpdateModal,
    updateReportStatus,
    openRemoveModal,
    removeMaterial,
    openRestoreModal,
    restoreMaterial,
  };
}
