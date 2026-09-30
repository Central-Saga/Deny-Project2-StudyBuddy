'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  FileWarning,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

type ReportStatus =
  | 'pending'
  | 'reviewed'
  | 'dismissed'
  | 'action_taken';

type StatusFilter = 'all' | ReportStatus;

interface SimpleUser {
  id: number;
  name: string;
  email: string;
}

interface ReportMaterial {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  subject?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  is_removed?: boolean;
  deleted_at?: string | null;
  uploader?: SimpleUser | null;
}

interface MaterialReport {
  id: number;
  material_id: number;
  reporter_id: number;
  reason: string;
  status: ReportStatus;
  resolution_note?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  material?: ReportMaterial | null;
  reporter?: SimpleUser | null;
  reviewer?: SimpleUser | null;
}

interface UpdateTarget {
  report: MaterialReport;
  status: ReportStatus;
  resolutionNote: string;
}

interface RemoveTarget {
  report: MaterialReport;
  resolutionNote: string;
}

interface RestoreTarget {
  report: MaterialReport;
  resolutionNote: string;
}

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatFileSize(value?: number | null): string {
  if (!value || value <= 0) {
    return '-';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'reviewed':
      return 'Reviewed';
    case 'dismissed':
      return 'Dismissed';
    case 'action_taken':
      return 'Action Taken';
    default:
      return status;
  }
}

function getStatusClass(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'reviewed':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'dismissed':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'action_taken':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

function getStatusDotClass(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500';
    case 'reviewed':
      return 'bg-blue-500';
    case 'dismissed':
      return 'bg-slate-400';
    case 'action_taken':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-400';
  }
}

function getStatusDescription(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'Laporan belum ditinjau oleh administrator.';
    case 'reviewed':
      return 'Laporan sudah diperiksa dan masih dapat ditindaklanjuti.';
    case 'dismissed':
      return 'Laporan ditutup karena tidak memerlukan tindakan lanjutan.';
    case 'action_taken':
      return 'Tindakan moderasi telah dilakukan pada laporan ini.';
    default:
      return '';
  }
}

function getDownloadFilename(
  response: Response,
  fallback: string
): string {
  const disposition = response.headers.get('content-disposition');

  if (!disposition) {
    return fallback;
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1].replace(/["']/g, ''));
  }

  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || fallback;
}

export default function AdminReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<MaterialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReport, setSelectedReport] =
    useState<MaterialReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

      setReports(
        Array.isArray(payload?.data) ? payload.data : []
      );
    } catch (caughtError: unknown) {
      setError(
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

  const closeDetail = () => {
    if (
      detailLoading ||
      removeLoading ||
      restoreLoading ||
      updateLoading
    ) {
      return;
    }

    setSelectedReport(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50 p-6 shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Moderation Center
            </div>

            <h1 className="text-2xl font-bold tracking-tight !text-slate-900 sm:text-3xl">
              Material Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tinjau laporan pengguna, periksa material, dokumentasikan keputusan,
              dan lakukan tindakan moderasi tanpa kehilangan riwayat laporan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReports()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{error}</div>
          <button type="button" onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{success}</div>
          <button type="button" onClick={() => setSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Reports"
          value={summary.total}
          description="Seluruh laporan masuk"
          icon={<FileWarning className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending}
          description="Memerlukan perhatian"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-600"
        />
        <SummaryCard
          label="Reviewed"
          value={summary.reviewed}
          description="Sudah diperiksa admin"
          icon={<ShieldCheck className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Resolved"
          value={summary.resolved}
          description="Dismissed / Action Taken"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Moderation Queue
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Menampilkan {filteredReports.length} dari {reports.length} laporan.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari material, reporter..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-52"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
                <option value="action_taken">Action Taken</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileWarning className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              Tidak ada laporan ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Ubah filter atau kata pencarian untuk melihat laporan lainnya.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <article
                key={report.id}
                className="p-5 transition hover:bg-slate-50/60 lg:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="max-w-xl truncate text-sm font-bold text-slate-900 sm:text-base">
                            {report.material?.title ||
                              `Material #${report.material_id}`}
                          </h3>

                          {report.material?.is_removed && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                              <Trash2 className="h-3 w-3" />
                              Removed
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {report.material?.subject ||
                              'Subject tidak tersedia'}
                          </span>
                          <span>Report #{report.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Alasan Laporan
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {report.reason}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5 text-slate-400" />
                        Reporter:
                        <strong className="font-semibold text-slate-700">
                          {report.reporter?.name ||
                            `User #${report.reporter_id}`}
                        </strong>
                      </span>

                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:items-end">
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${getStatusClass(
                        report.status
                      )}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                          report.status
                        )}`}
                      />
                      {getStatusLabel(report.status)}
                    </span>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => void openDetail(report)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={() => openUpdateModal(report)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedReport && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-950">
                    Detail Moderasi
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                      selectedReport.status
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                        selectedReport.status
                      )}`}
                    />
                    {getStatusLabel(selectedReport.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Report #{selectedReport.id} · {formatDateTime(selectedReport.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-4 p-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : (
              <div className="space-y-5 p-6">
                <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                  <section className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">
                            {selectedReport.material?.title ||
                              `Material #${selectedReport.material_id}`}
                          </h3>
                          {selectedReport.material?.is_removed && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                              MATERIAL REMOVED
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {selectedReport.material?.subject ||
                            'Subject tidak tersedia'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {selectedReport.material?.description ||
                        'Material tidak memiliki deskripsi.'}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="File Type"
                        value={
                          selectedReport.material?.file_type
                            ? selectedReport.material.file_type.toUpperCase()
                            : '-'
                        }
                        icon={<FileText className="h-4 w-4" />}
                      />
                      <InfoBox
                        label="File Size"
                        value={formatFileSize(
                          selectedReport.material?.file_size
                        )}
                        icon={<HardDrive className="h-4 w-4" />}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          selectedReport.material?.is_removed ||
                          downloadingId === selectedReport.id
                        }
                        onClick={() =>
                          void downloadMaterial(selectedReport)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {downloadingId === selectedReport.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {selectedReport.material?.is_removed
                          ? 'Material Removed'
                          : downloadingId === selectedReport.id
                            ? 'Mengunduh...'
                            : 'Download Material'}
                      </button>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
                    <PersonBlock
                      label="Reporter"
                      user={selectedReport.reporter}
                      fallback={`User #${selectedReport.reporter_id}`}
                    />
                    <PersonBlock
                      label="Uploader"
                      user={selectedReport.material?.uploader}
                      fallback="Uploader tidak tersedia"
                    />
                    <PersonBlock
                      label="Reviewed By"
                      user={selectedReport.reviewer}
                      fallback="Belum direview"
                    />
                  </section>
                </div>

                <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                    Alasan Laporan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedReport.reason}
                  </p>
                </section>

                {selectedReport.resolution_note && (
                  <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                          Resolution Note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {selectedReport.resolution_note}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          Reviewed {formatDateTime(selectedReport.reviewed_at)}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Moderation Actions
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {getStatusDescription(selectedReport.status)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openUpdateModal(selectedReport, 'reviewed')
                        }
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Mark Reviewed
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openUpdateModal(selectedReport, 'dismissed')
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Dismiss Report
                      </button>

                      {selectedReport.material?.is_removed ? (
                        <button
                          type="button"
                          onClick={() => openRestoreModal(selectedReport)}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Pulihkan Material
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRemoveModal(selectedReport)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Nonaktifkan Material
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {updateTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updateLoading
            ) {
              setUpdateTarget(null);
              setUpdateError('');
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-900">
                  Update Moderation Status
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {updateTarget.report.material?.title ||
                    `Material #${updateTarget.report.material_id}`}
                </p>
              </div>
            </div>

            {updateError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {updateError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </label>
                <select
                  value={updateTarget.status}
                  disabled={updateLoading}
                  onChange={(event) =>
                    setUpdateTarget((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as ReportStatus,
                          }
                        : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="dismissed">Dismissed</option>
                  {updateTarget.status === 'action_taken' && (
                    <option value="action_taken" disabled>
                      Action Taken (otomatis)
                    </option>
                  )}
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {getStatusDescription(updateTarget.status)}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Resolution Note
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {updateTarget.resolutionNote.length}/2000
                  </span>
                </div>
                <textarea
                  value={updateTarget.resolutionNote}
                  disabled={updateLoading}
                  maxLength={2000}
                  rows={5}
                  onChange={(event) =>
                    setUpdateTarget((current) =>
                      current
                        ? {
                            ...current,
                            resolutionNote: event.target.value,
                          }
                        : null
                    )
                  }
                  placeholder="Tuliskan hasil review atau alasan keputusan admin..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
                {(updateTarget.status === 'dismissed' ||
                  updateTarget.status === 'action_taken') && (
                  <p className="mt-2 text-[11px] text-amber-600">
                    Catatan minimal 10 karakter wajib untuk keputusan ini.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={updateLoading}
                onClick={() => {
                  setUpdateTarget(null);
                  setUpdateError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={updateLoading}
                onClick={() => void updateReportStatus()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {updateLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {updateLoading ? 'Menyimpan...' : 'Simpan Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !removeLoading
            ) {
              setRemoveTarget(null);
              setRemoveError('');
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">
                  Nonaktifkan Material Sementara?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Material{' '}
                  <strong className="font-semibold text-slate-700">
                    {removeTarget.report.material?.title ||
                      `#${removeTarget.report.material_id}`}
                  </strong>{' '}
                  akan disembunyikan dari pengguna. File fisik tetap disimpan sehingga material masih dapat dipulihkan.
                  Riwayat laporan tetap tersimpan.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-xs leading-5 text-red-700">
              Material hanya dinonaktifkan dengan soft delete. File fisik tidak
              dihapus, sehingga admin masih dapat memulihkannya nanti.
            </div>

            {removeError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs leading-5 text-red-700">
                {removeError}
              </div>
            )}

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Catatan Tindakan
                </label>
                <span className="text-[10px] text-slate-400">
                  {removeTarget.resolutionNote.length}/2000
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={2000}
                disabled={removeLoading}
                value={removeTarget.resolutionNote}
                onChange={(event) =>
                  setRemoveTarget((current) =>
                    current
                      ? {
                          ...current,
                          resolutionNote: event.target.value,
                        }
                      : null
                  )
                }
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={removeLoading}
                onClick={() => {
                  setRemoveTarget(null);
                  setRemoveError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={removeLoading}
                onClick={() => void removeMaterial()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {removeLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {removeLoading ? 'Menonaktifkan...' : 'Ya, Nonaktifkan Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !restoreLoading
            ) {
              setRestoreTarget(null);
              setRestoreError('');
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <RotateCcw className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold !text-slate-900">
                  Pulihkan Material?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Material{' '}
                  <span className="font-semibold text-slate-700">
                    {restoreTarget.report.material?.title ||
                      `#${restoreTarget.report.material_id}`}
                  </span>{' '}
                  akan ditampilkan kembali kepada pengguna.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Catatan Pemulihan
              </label>
              <textarea
                value={restoreTarget.resolutionNote}
                disabled={restoreLoading}
                onChange={(event) =>
                  setRestoreTarget((current) =>
                    current
                      ? {
                          ...current,
                          resolutionNote: event.target.value,
                        }
                      : null
                  )
                }
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                placeholder="Jelaskan alasan material dipulihkan..."
              />
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
                <span className={restoreError ? 'text-red-600' : 'text-slate-400'}>
                  {restoreError || 'Minimal 10 karakter.'}
                </span>
                <span className="text-slate-400">
                  {restoreTarget.resolutionNote.length}/2000
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => {
                  setRestoreTarget(null);
                  setRestoreError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => void restoreMaterial()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {restoreLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {restoreLoading ? 'Memulihkan...' : 'Ya, Pulihkan Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
  valueClass = '!text-slate-900',
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{description}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function PersonBlock({
  label,
  user,
  fallback,
}: {
  label: string;
  user?: SimpleUser | null;
  fallback: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-700">
        {user?.name || fallback}
      </p>
      {user?.email && (
        <p className="mt-0.5 break-all text-[11px] text-slate-400">
          {user.email}
        </p>
      )}
    </div>
  );
}
