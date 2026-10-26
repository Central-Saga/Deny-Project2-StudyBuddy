import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL, getAccessToken } from '@/lib/auth';
import type { Material } from '@/components/materials/types';

interface UseMaterialReportParams {
  setError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export function useMaterialReport({
  setError,
  showSuccess,
}: UseMaterialReportParams) {
  const router = useRouter();

  const [materialToReport, setMaterialToReport] =
    useState<Material | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');

  const openReportModal = (material: Material) => {
    if (material.is_owner) return;
    setMaterialToReport(material);
    setReportReason('');
    setReportError('');
  };

  const closeReportModal = () => {
    if (reporting) return;
    setMaterialToReport(null);
    setReportReason('');
    setReportError('');
  };

  const handleReportSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!materialToReport) return;
    const reason = reportReason.trim();
    if (reason.length < 10) {
      setReportError(
        'Alasan laporan minimal 10 karakter agar admin dapat meninjau dengan jelas.'
      );
      return;
    }
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setReporting(true);
    setReportError('');
    setError('');
    try {
      const response = await fetch(
        `${API_URL}/materials/${materialToReport.id}/reports`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason,
          }),
        }
      );
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('meetspace_auth_token');
        localStorage.removeItem('user_data');
        router.push('/login');
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 422 && result.errors) {
          const firstError = Object.values(result.errors)[0];
          if (
            Array.isArray(firstError) &&
            firstError.length > 0
          ) {
            throw new Error(String(firstError[0]));
          }
        }
        throw new Error(
          result.message ||
            'Gagal mengirim laporan materi.'
        );
      }
      const reportedTitle = materialToReport.title;
      setMaterialToReport(null);
      setReportReason('');
      setReportError('');
      showSuccess(
        result.message ||
          `Laporan untuk "${reportedTitle}" berhasil dikirim dan menunggu review admin.`
      );
    } catch (err) {
      console.error('Gagal melaporkan materi:', err);
      setReportError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim laporan materi.'
      );
    } finally {
      setReporting(false);
    }
  };

  return {
    materialToReport,
    reportReason,
    setReportReason,
    reporting,
    reportError,
    setReportError,
    openReportModal,
    closeReportModal,
    handleReportSubmit,
  };
}
