import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  MaterialReport,
  StatusFilter,
} from '@/components/admin-reports/types';
import {
  clearAuthStorage,
  getDownloadFilename,
  getStoredToken,
} from '@/components/admin-reports/utils';

export function useReportsData() {
  const router = useRouter();

  const [reports, setReports] = useState<MaterialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportsLoadError, setReportsLoadError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReport, setSelectedReport] =
    useState<MaterialReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);


  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);
  const handleUnauthorized = useCallback(
    (status: number): boolean => {
      if (status === 401) {
        clearAuthStorage();
        router.replace('/login');
        return true;
      }

      if (status === 403) {
        router.replace('/dashboard');
        return true;
      }

      return false;
    },
    [router]
  );

  const loadReports = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setLoading(true);
    setError('');
    setReportsLoadError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal mengambil laporan material.'
        );
      }

      if (!Array.isArray(payload?.data)) {
        throw new Error(
          'Respons daftar laporan dari server tidak valid.'
        );
      }

      setReports(payload.data);
    } catch (caughtError: unknown) {
      setReportsLoadError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Terjadi kesalahan saat mengambil laporan material.'
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, router]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter(
        (report) => report.status === 'pending'
      ).length,
      reviewed: reports.filter(
        (report) => report.status === 'reviewed'
      ).length,
      resolved: reports.filter(
        (report) =>
          report.status === 'dismissed' ||
          report.status === 'action_taken'
      ).length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      if (
        statusFilter !== 'all' &&
        report.status !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        report.material?.title,
        report.material?.subject,
        report.reporter?.name,
        report.reporter?.email,
        report.material?.uploader?.name,
        report.reason,
        report.resolution_note,
      ];

      return searchableValues.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [reports, searchQuery, statusFilter]);

  const openDetail = async (report: MaterialReport) => {
    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setSelectedReport(report);
    setDetailLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports/${report.id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal mengambil detail laporan.'
        );
      }

      if (payload?.data) {
        setSelectedReport(payload.data);
      }
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengambil detail laporan.'
      );
      setSelectedReport(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const downloadMaterial = async (report: MaterialReport) => {
    if (report.material?.is_removed) {
      setError(
        'Material sudah dihapus melalui proses moderasi dan tidak dapat diunduh.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setDownloadingId(report.id);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/material-reports/${report.id}/download`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/octet-stream, application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.message || 'Gagal mengunduh material.'
        );
      }

      const blob = await response.blob();
      const fallbackName = `${
        report.material?.title || `material-${report.material_id}`
      }.${report.material?.file_type || 'file'}`;
      const filename = getDownloadFilename(
        response,
        fallbackName
      );

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengunduh material.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    reports,
    setReports,
    loading,
    error,
    setError,
    reportsLoadError,
    success,
    setSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedReport,
    setSelectedReport,
    detailLoading,
    downloadingId,
    handleUnauthorized,
    loadReports,
    summary,
    filteredReports,
    openDetail,
    downloadMaterial,
  };
}
