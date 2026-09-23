'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Lock,
  Globe,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
  Users,
  BookOpen,
  Crown,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface Subject {
  id: number;
  code: string;
  name: string;
}

interface GroupMember {
  id: number;
  user_id: number;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  joined_at?: string | null;
  user?: {
    id: number;
    name: string;
  };
}

interface Group {
  id: number;
  creator_id: number;
  subject_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  max_members: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
  };
  subject?: Subject | null;
  members?: GroupMember[];
}

const API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export default function GroupsPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [newGroup, setNewGroup] = useState({
    name: '',
    subject_id: '',
    description: '',
    max_members: 10,
    is_private: false,
  });

  const getToken = () => {
    if (typeof window === 'undefined') return null;

    return (
      localStorage.getItem('meetspace_auth_token') ||
      localStorage.getItem('access_token')
    );
  };

  const fetchGroups = useCallback(async () => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const userData = localStorage.getItem('user_data');

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUserId(parsedUser.id);
      } catch (error) {
        console.error('Gagal membaca data user:', error);
      }
    }

    try {
      const [groupsRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/api/groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        }),

        fetch(`${API_URL}/api/subjects`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        }),
      ]);

      if (groupsRes.status === 401 || subjectsRes.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('meetspace_auth_token');
        localStorage.removeItem('user_data');

        router.push('/login');
        return;
      }

      if (!groupsRes.ok) {
        throw new Error(
          `Gagal mengambil data grup (Status: ${groupsRes.status})`
        );
      }

      if (!subjectsRes.ok) {
        throw new Error(
          `Gagal mengambil data mata kuliah (Status: ${subjectsRes.status})`
        );
      }

      const groupsData = await groupsRes.json();
      const subjectsData = await subjectsRes.json();

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Gagal mengambil data:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data dari backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleToggleJoin = async (groupId: number) => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setErrorMsg(null);

      const res = await fetch(
        `${API_URL}/api/groups/${groupId}/toggle-join`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('meetspace_auth_token');
        localStorage.removeItem('user_data');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            `Gagal mengubah keanggotaan grup (Status: ${res.status})`
        );
      }

      setSuccessMsg(data?.message || 'Keanggotaan berhasil diperbarui.');

      await fetchGroups();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (error) {
      console.error('Gagal mengubah keanggotaan grup:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal mengubah keanggotaan grup.'
      );
    }
  };

  const handleCreateGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!newGroup.subject_id) {
      setFormError('Silakan pilih mata kuliah terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: newGroup.name,
          subject_id: Number(newGroup.subject_id),
          description: newGroup.description || null,
          max_members: Number(newGroup.max_members),
          is_private: newGroup.is_private,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('meetspace_auth_token');
        localStorage.removeItem('user_data');

        router.push('/login');
        return;
      }

      if (!res.ok) {
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : '';

        throw new Error(
          validationErrors ||
            data?.message ||
            `Gagal membuat grup (Status: ${res.status})`
        );
      }

      setShowModal(false);

      setNewGroup({
        name: '',
        subject_id: '',
        description: '',
        max_members: 10,
        is_private: false,
      });

      setSuccessMsg('Grup belajar berhasil dibuat.');

      await fetchGroups();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (error) {
      console.error('Gagal membuat grup:', error);

      setFormError(
        error instanceof Error
          ? error.message
          : 'Gagal membuat grup.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormError(null);

    setNewGroup({
      name: '',
      subject_id: subjects.length > 0 ? String(subjects[0].id) : '',
      description: '',
      max_members: 10,
      is_private: false,
    });

    setShowModal(true);
  };

  const acceptedMemberCount = (group: Group) =>
    group.members?.filter((member) => member.status === 'accepted').length || 0;

  const isUserJoined = (group: Group) =>
    group.members?.some(
      (member) =>
        member.user?.id === currentUserId &&
        member.status === 'accepted'
    ) || false;

  const filteredGroups = groups.filter((group) => {
    const keyword = searchTerm.toLowerCase();

    return (
      group.name.toLowerCase().includes(keyword) ||
      (group.subject?.name || '').toLowerCase().includes(keyword) ||
      (group.subject?.code || '').toLowerCase().includes(keyword) ||
      (group.description || '').toLowerCase().includes(keyword)
    );
  });

  const totalMembers = groups.reduce(
    (total, group) => total + acceptedMemberCount(group),
    0
  );

  const privateGroups = groups.filter((group) => group.is_private).length;

  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Study Community
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Grup Belajar
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Temukan teman belajar yang sevisi atau buat grup sendiri
                untuk belajar bersama.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchGroups}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Baru
            </button>
          </div>
        </div>
      </section>

      {/* ALERT */}
      {errorMsg && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Terjadi kesalahan</p>
              <p className="mt-0.5 text-xs text-red-600">{errorMsg}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* SUMMARY */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Grup
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {groups.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Komunitas belajar yang tersedia
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Anggota
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalMembers}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Akumulasi anggota aktif
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Mata Kuliah
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {subjects.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Subject tersedia dari database
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Grup Privat
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {privateGroups}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lock className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Grup dengan akses terbatas
          </p>
        </div>
      </section>

      {/* SEARCH */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama grup, mata kuliah, atau deskripsi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Menampilkan{' '}
            <span className="font-bold text-slate-800">
              {filteredGroups.length}
            </span>{' '}
            grup
          </div>
        </div>
      </section>

      {/* GROUP CONTENT */}
      {loading ? (
        <section className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Memuat grup belajar...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Mengambil data terbaru dari database.
            </p>
          </div>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-700">
            {searchTerm
              ? 'Grup tidak ditemukan'
              : 'Belum ada grup belajar'}
          </h3>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            {searchTerm
              ? 'Coba gunakan kata kunci lain untuk menemukan grup yang sesuai.'
              : 'Jadilah yang pertama membuat komunitas belajar di platform ini.'}
          </p>

          {!searchTerm && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Pertama
            </button>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const isJoined = isUserJoined(group);
            const memberCount = acceptedMemberCount(group);
            const isFull = memberCount >= group.max_members;

            return (
              <article
                key={group.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                {/* CARD TOP */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold backdrop-blur">
                        <BookOpen className="h-3 w-3" />
                        {group.subject?.code || 'SUBJECT'}
                      </div>

                      <h3 className="line-clamp-2 text-base font-bold leading-snug">
                        {group.name}
                      </h3>

                      <p className="mt-1 text-[11px] font-medium text-blue-100">
                        {group.subject?.name || 'Mata kuliah belum tersedia'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
                      {group.is_private ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-500">
                    {group.description || 'Tidak ada deskripsi grup.'}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        Ketua
                      </span>

                      <span className="max-w-[150px] truncate text-[11px] font-semibold text-slate-700">
                        {group.creator?.name || 'Anonim'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        Anggota
                      </span>

                      <span
                        className={`text-[11px] font-bold ${
                          isFull ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {memberCount} / {group.max_members}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-[11px] text-slate-500">
                        {group.is_private ? (
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        Akses
                      </span>

                      <span className="text-[11px] font-semibold text-slate-700">
                        {group.is_private ? 'Privat' : 'Publik'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleJoin(group.id)}
                        disabled={!isJoined && isFull}
                        className={[
                          'flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition',
                          isJoined
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : isFull
                              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                              : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
                        ].join(' ')}
                      >
                        {isJoined ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Sudah Bergabung
                          </>
                        ) : isFull ? (
                          <>
                            <Users className="h-4 w-4" />
                            Grup Penuh
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Gabung Grup
                          </>
                        )}
                      </button>

                      {isJoined && (
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          title="Buka chat diskusi"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {group.is_private
                          ? 'Memerlukan persetujuan'
                          : 'Terbuka untuk mahasiswa'}
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* CREATE GROUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Create Community
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Buat Grup Belajar
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormError(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="space-y-5 p-5 sm:p-6"
            >
              {/* FORM ERROR */}
              {formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-xs leading-5 text-red-700">
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Nama Grup
                </label>

                <input
                  type="text"
                  required
                  maxLength={255}
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup({
                      ...newGroup,
                      name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Study Buddy Basis Data"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* SUBJECT */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Mata Kuliah
                  </label>

                  <span className="text-[9px] font-medium text-blue-500">
                    Dari database
                  </span>
                </div>

                <select
                  required
                  value={newGroup.subject_id}
                  onChange={(e) =>
                    setNewGroup({
                      ...newGroup,
                      subject_id: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Pilih mata kuliah</option>

                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} — {subject.name}
                    </option>
                  ))}
                </select>

                {subjects.length === 0 && (
                  <p className="mt-1.5 text-[10px] text-amber-600">
                    Data mata kuliah belum tersedia.
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Deskripsi
                </label>

                <textarea
                  rows={4}
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({
                      ...newGroup,
                      description: e.target.value,
                    })
                  }
                  placeholder="Jelaskan tujuan belajar dan materi yang akan dibahas..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* CAPACITY + ACCESS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Maksimal Anggota
                  </label>

                  <select
                    value={newGroup.max_members}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        max_members: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value={5}>5 orang</option>
                    <option value={10}>10 orang</option>
                    <option value={15}>15 orang</option>
                    <option value={20}>20 orang</option>
                    <option value={50}>50 orang</option>
                    <option value={100}>100 orang</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Privasi
                  </label>

                  <select
                    value={newGroup.is_private ? 'private' : 'public'}
                    onChange={(e) =>
                      setNewGroup({
                        ...newGroup,
                        is_private: e.target.value === 'private',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="public">
                      Publik — bisa langsung bergabung
                    </option>
                    <option value="private">
                      Privat — perlu persetujuan
                    </option>
                  </select>
                </div>
              </div>

              {/* INFO */}
              <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                <div>
                  <p className="text-xs font-semibold text-blue-800">
                    Grup yang baik dimulai dari tujuan yang jelas
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-blue-600">
                    Pilih mata kuliah yang sesuai agar anggota mudah
                    menemukan grup berdasarkan topik belajar.
                  </p>
                </div>
              </div>

              {/* BUTTON */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError(null);
                  }}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting || subjects.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Buat Grup
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}