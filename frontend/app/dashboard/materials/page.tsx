'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Upload,
  User,
  X,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
).replace(/\/$/, '');

interface MaterialUser {
  id: number;
  name: string;
  email?: string;
}

interface Material {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  user?: MaterialUser;
}

interface MaterialsResponse {
  data: Material[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function MaterialsPage() {
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalMaterials, setTotalMaterials] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    file: null as File | null,
  });

  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('access_token') || '';
  };

  const showSuccess = (message: string) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 1
    )} ${units[index]}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getFileTypeLabel = (type: string) => {
    if (!type) return 'FILE';
    return type.toUpperCase();
  };

  const getFileTypeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-100';

      case 'doc':
      case 'docx':
        return 'bg-blue-50 text-blue-700 border-blue-100';

      case 'ppt':
      case 'pptx':
        return 'bg-amber-50 text-amber-700 border-amber-100';

      case 'zip':
      case 'rar':
        return 'bg-violet-50 text-violet-700 border-violet-100';

      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';

      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
        return <FileText className="h-5 w-5" />;

      case 'zip':
      case 'rar':
        return <FileArchive className="h-5 w-5" />;

      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon className="h-5 w-5" />;

      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const fetchMaterials = useCallback(
    async (page = 1) => {
      const token = getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        params.append('page', String(page));

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        const response = await fetch(
          `${API_URL}/materials?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data materi (${response.status})`
          );
        }

        const result: MaterialsResponse = await response.json();

        setMaterials(Array.isArray(result.data) ? result.data : []);
        setCurrentPage(result.current_page || 1);
        setLastPage(result.last_page || 1);
        setTotalMaterials(result.total || 0);
      } catch (err) {
        console.error('Gagal mengambil materi:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data materi.'
        );
      } finally {
        setLoading(false);
      }
    },
    [router, searchQuery]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchMaterials]);

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Sama dengan validasi backend: maksimal 10 MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10 MB.');
      event.target.value = '';
      return;
    }

    setFormData((previous) => ({
      ...previous,
      file: selectedFile,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert('Judul materi wajib diisi.');
      return;
    }

    if (!formData.subject.trim()) {
      alert('Mata kuliah wajib diisi.');
      return;
    }

    if (!formData.file) {
      alert('Silakan pilih file materi terlebih dahulu.');
      return;
    }

    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadData = new FormData();

      uploadData.append('title', formData.title.trim());
      uploadData.append('subject', formData.subject.trim());
      uploadData.append(
        'description',
        formData.description.trim()
      );
      uploadData.append('file', formData.file);

      const response = await fetch(`${API_URL}/materials`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const result = await response.json();

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
          result.message || 'Gagal mengunggah materi.'
        );
      }

      setFormData({
        title: '',
        subject: '',
        description: '',
        file: null,
      });

      setIsModalOpen(false);

      showSuccess('Materi berhasil diunggah.');

      await fetchMaterials(1);
    } catch (err) {
      console.error('Gagal upload materi:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah materi.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setDownloadingId(material.id);

    try {
      const response = await fetch(
        `${API_URL}/materials/${material.id}/download`,
        {
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        let message = 'Gagal mengunduh materi.';

        try {
          const result = await response.json();

          if (result.message) {
            message = result.message;
          }
        } catch {
          // Response bukan JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const extension =
        material.file_type?.toLowerCase() || 'file';

      const fileName = `${material.title}.${extension}`;

      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);

      showSuccess(`Mengunduh ${fileName}...`);
    } catch (err) {
      console.error('Gagal download:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Gagal mengunduh file.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    fetchMaterials(page);
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* ================= HEADER ================= */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-28 w-28 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BookOpen className="h-6 w-6" />
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                  Study Materials
                </span>

                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                  LIVE API
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Materi Belajar
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Temukan, bagikan, dan unduh materi belajar
                yang tersimpan langsung di server Study Buddy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Unggah Materi
            </button>
          </div>
        </div>
      </section>

      {/* ================= SUCCESS ================= */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <span className="font-medium">
            {success}
          </span>
        </div>
      )}

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Terjadi kesalahan
            </p>

            <p className="mt-1 text-xs leading-5">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchMaterials(currentPage)}
              className="mt-2 text-xs font-bold underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* ================= STAT CARDS ================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Materi
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalMaterials}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Tersimpan di database
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Ditampilkan
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {materials.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Materi pada halaman ini
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Halaman
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {currentPage}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Dari {lastPage} halaman
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Batas Upload
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                10 MB
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Upload className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Sesuai validasi backend
          </p>
        </div>
      </section>

      {/* ================= SEARCH ================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cari Materi
            </h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Pencarian dilakukan langsung melalui API.
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari judul, mata kuliah, atau deskripsi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {/* ================= MATERIAL LIST ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
              Koleksi Materi
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Materi Terbaru
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Daftar materi diambil langsung dari database.
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
            {materials.length} ditampilkan
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Memuat materi...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Mengambil data dari server
            </p>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <BookOpen className="h-6 w-6 text-slate-300" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-700">
              Belum ada materi
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Tidak ada materi yang sesuai dengan
              pencarian kamu.
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Unggah Materi
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {materials.map((material) => (
                <article
                  key={material.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                        {material.subject}
                      </span>

                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${getFileTypeStyle(
                          material.file_type
                        )}`}
                      >
                        {getFileTypeLabel(material.file_type)}
                      </span>
                    </div>

                    <span className="shrink-0 text-[10px] font-medium text-slate-400">
                      {formatDate(material.created_at)}
                    </span>
                  </div>

                  {/* File Icon + Title */}
                  <div className="mt-5 flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getFileTypeStyle(
                        material.file_type
                      )}`}
                    >
                      {getFileIcon(material.file_type)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-blue-700">
                        {material.title}
                      </h3>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatFileSize(material.file_size)} ·{' '}
                        {getFileTypeLabel(material.file_type)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                    {material.description ||
                      'Tidak ada deskripsi untuk materi ini.'}
                  </p>

                  {/* Divider */}
                  <div className="my-5 border-t border-slate-100" />

                  {/* Footer */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Diunggah oleh
                        </p>

                        <p className="truncate text-xs font-semibold text-slate-700">
                          {material.user?.name || 'Mahasiswa'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(material)}
                      disabled={
                        downloadingId === material.id
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {downloadingId === material.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengunduh...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Unduh Materi
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <p className="text-xs text-slate-400">
                  Halaman{' '}
                  <span className="font-semibold text-slate-700">
                    {currentPage}
                  </span>{' '}
                  dari{' '}
                  <span className="font-semibold text-slate-700">
                    {lastPage}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(currentPage - 1)
                    }
                    disabled={currentPage === 1}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(currentPage + 1)
                    }
                    disabled={currentPage === lastPage}
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================= UPLOAD MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Study Materials
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Unggah Materi
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  !uploading && setIsModalOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5"
            >
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Judul Materi
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Rangkuman Basis Data"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Mata Kuliah
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pemrograman Web"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Deskripsi
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tuliskan ringkasan isi materi..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* File */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  File Materi
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50/30">
                  <input
                    type="file"
                    required
                    disabled={uploading}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png"
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />

                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    {formData.file
                      ? formData.file.name
                      : 'Klik untuk memilih file'}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR, JPG,
                    PNG
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm">
                    Maksimal 10 MB
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {uploading
                    ? 'Mengunggah...'
                    : 'Simpan & Unggah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}