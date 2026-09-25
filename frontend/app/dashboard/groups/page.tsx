'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Globe,
  Loader2,
  Link2,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

type MemberStatus = 'pending' | 'accepted' | 'rejected';
type MemberRole = 'admin' | 'member';

type Subject = {
  id: number;
  code?: string | null;
  name: string;
};

type GroupMember = {
  id: number;
  study_group_id: number;
  user_id: number;
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string | null;
  user?: {
    id: number;
    name: string;
    profile?: {
      avatar_url?: string | null;
    } | null;
  } | null;
};

type Group = {
  id: number;
  creator_id: number;
  subject_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  max_members: number;
  is_private: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  creator?: {
    id: number;
    name: string;
    profile?: {
      avatar_url?: string | null;
    } | null;
  } | null;
  subject?: Subject | null;
  members?: GroupMember[];
};

type GroupFormState = {
  name: string;
  subject_id: string;
  description: string;
  max_members: number;
  is_private: boolean;
};

type SessionFormState = {
  title: string;
  description: string;
  meeting_link: string;
  date: string;
  time: string;
  max_participants: number;
  duration_minutes: number;
};

type ApiMessage = {
  message?: string;
  errors?: Record<string, string[]>;
  data?: Group;
  user?: {
    id: number;
  };
};

const emptyGroupForm: GroupFormState = {
  name: '',
  subject_id: '',
  description: '',
  max_members: 10,
  is_private: false,
};

const emptySessionForm: SessionFormState = {
  title: '',
  description: '',
  meeting_link: '',
  date: '',
  time: '19:00',
  max_participants: 10,
  duration_minutes: 60,
};

function getLocalDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function getErrorMessage(
  payload: ApiMessage,
  fallback: string
): string {
  if (payload.errors) {
    const validationMessages = Object.values(
      payload.errors
    ).flat();

    if (validationMessages.length > 0) {
      return validationMessages[0];
    }
  }

  return payload.message || fallback;
}

export default function GroupsPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(
    emptyGroupForm
  );

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionGroup, setSessionGroup] = useState<Group | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(
    emptySessionForm
  );
  const [savingSession, setSavingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [membershipActionGroupId, setMembershipActionGroupId] =
    useState<number | null>(null);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);

    window.setTimeout(() => {
      setSuccessMsg(null);
    }, 3500);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAuthStorage();
    router.replace('/login');
  }, [router]);

  const fetchGroups = useCallback(
    async (silent = false) => {
      const token = getStoredToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMsg(null);

      try {
        const [groupsResponse, subjectsResponse, meResponse] =
          await Promise.all([
            fetch(`${API_URL}/groups`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
            fetch(`${API_URL}/subjects`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
            fetch(`${API_URL}/me`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
          ]);

        if (
          groupsResponse.status === 401 ||
          subjectsResponse.status === 401 ||
          meResponse.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        if (!groupsResponse.ok) {
          throw new Error('Gagal mengambil data grup.');
        }

        if (!subjectsResponse.ok) {
          throw new Error('Gagal mengambil data mata kuliah.');
        }

        if (!meResponse.ok) {
          throw new Error('Gagal mengambil data pengguna.');
        }

        const groupsPayload = await groupsResponse.json();
        const subjectsPayload = await subjectsResponse.json();
        const mePayload: ApiMessage = await meResponse.json();

        const nextGroups = Array.isArray(groupsPayload)
          ? groupsPayload
          : Array.isArray(groupsPayload?.data)
            ? groupsPayload.data
            : [];

        const nextSubjects = Array.isArray(subjectsPayload)
          ? subjectsPayload
          : Array.isArray(subjectsPayload?.data)
            ? subjectsPayload.data
            : [];

        setGroups(nextGroups);
        setSubjects(nextSubjects);
        setCurrentUserId(mePayload.user?.id ?? null);
      } catch (error) {
        console.error('Gagal memuat grup:', error);

        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil data grup.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchGroupDetail = useCallback(
    async (groupId: number) => {
      const token = getStoredToken();

      if (!token) {
        handleUnauthorized();
        return null;
      }

      setLoadingDetail(true);
      setErrorMsg(null);

      try {
        const response = await fetch(
          `${API_URL}/groups/${groupId}`,
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
          handleUnauthorized();
          return null;
        }

        const payload: Group & ApiMessage = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.message || 'Gagal mengambil detail grup.'
          );
        }

        setSelectedGroup(payload);
        return payload;
      } catch (error) {
        console.error('Gagal mengambil detail grup:', error);

        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Gagal mengambil detail grup.'
        );

        return null;
      } finally {
        setLoadingDetail(false);
      }
    },
    [handleUnauthorized]
  );

  const openDetailModal = async (group: Group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
    await fetchGroupDetail(group.id);
  };

  const openCreateModal = () => {
    setFormMode('create');
    setEditingGroup(null);
    setFormError(null);
    setGroupForm({
      ...emptyGroupForm,
      subject_id:
        subjects.length > 0
          ? String(subjects[0].id)
          : '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (group: Group) => {
    setFormMode('edit');
    setEditingGroup(group);
    setFormError(null);
    setGroupForm({
      name: group.name,
      subject_id: group.subject_id
        ? String(group.subject_id)
        : '',
      description: group.description || '',
      max_members: group.max_members,
      is_private: group.is_private,
    });
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleSaveGroup = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!groupForm.name.trim()) {
      setFormError('Nama grup wajib diisi.');
      return;
    }

    if (!groupForm.subject_id) {
      setFormError('Silakan pilih mata kuliah.');
      return;
    }

    if (
      groupForm.max_members < 2 ||
      groupForm.max_members > 100
    ) {
      setFormError('Kapasitas grup harus antara 2 sampai 100 anggota.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setErrorMsg(null);

    try {
      const isEditing = formMode === 'edit' && editingGroup;

      const response = await fetch(
        isEditing
          ? `${API_URL}/groups/${editingGroup.id}`
          : `${API_URL}/groups`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: groupForm.name.trim(),
            subject_id: Number(groupForm.subject_id),
            description:
              groupForm.description.trim() || null,
            max_members: Number(groupForm.max_members),
            is_private: groupForm.is_private,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            isEditing
              ? 'Gagal memperbarui grup.'
              : 'Gagal membuat grup.'
          )
        );
      }

      setShowFormModal(false);
      setEditingGroup(null);
      setGroupForm(emptyGroupForm);

      showSuccess(
        isEditing
          ? payload.message || 'Grup berhasil diperbarui.'
          : 'Grup belajar berhasil dibuat.'
      );

      await fetchGroups(true);
    } catch (error) {
      console.error('Gagal menyimpan grup:', error);

      setFormError(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan grup.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openSessionModal = (group: Group) => {
    if (currentUserId !== group.creator_id) {
      setErrorMsg('Hanya ketua grup yang dapat membuat sesi belajar.');
      return;
    }

    setSessionGroup(group);
    setSessionError(null);
    setSessionForm({
      ...emptySessionForm,
      date: getLocalDateValue(),
      max_participants: Math.max(2, group.max_members),
    });
    setShowDetailModal(false);
    setShowSessionModal(true);
  };

  const handleCreateSession = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!sessionGroup) {
      setSessionError('Grup sesi tidak ditemukan.');
      return;
    }

    if (currentUserId !== sessionGroup.creator_id) {
      setSessionError('Hanya ketua grup yang dapat membuat sesi belajar.');
      return;
    }

    if (!sessionForm.title.trim()) {
      setSessionError('Judul sesi wajib diisi.');
      return;
    }

    if (!sessionForm.date || !sessionForm.time) {
      setSessionError('Tanggal dan jam sesi wajib diisi.');
      return;
    }

    setSavingSession(true);
    setSessionError(null);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_URL}/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          study_group_id: sessionGroup.id,
          title: sessionForm.title.trim(),
          description: sessionForm.description.trim() || null,
          meeting_link: sessionForm.meeting_link.trim() || null,
          max_participants: Number(sessionForm.max_participants),
          scheduled_at: `${sessionForm.date} ${sessionForm.time}:00`,
          duration_minutes: Number(sessionForm.duration_minutes),
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, 'Gagal membuat sesi belajar.')
        );
      }

      setShowSessionModal(false);
      setSessionGroup(null);
      setSessionForm(emptySessionForm);
      showSuccess(
        payload.message ||
          'Sesi belajar berhasil dibuat. Lihat jadwal pada menu Kalender.'
      );
    } catch (error) {
      console.error('Gagal membuat sesi belajar:', error);
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Gagal membuat sesi belajar.'
      );
    } finally {
      setSavingSession(false);
    }
  };

  const handleToggleJoin = async (group: Group) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setMembershipActionGroupId(group.id);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${group.id}/toggle-join`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            'Gagal memperbarui keanggotaan grup.'
          )
        );
      }

      showSuccess(
        payload.message || 'Keanggotaan grup berhasil diperbarui.'
      );

      await fetchGroups(true);

      if (showDetailModal && selectedGroup?.id === group.id) {
        await fetchGroupDetail(group.id);
      }
    } catch (error) {
      console.error('Gagal memperbarui membership:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui keanggotaan grup.'
      );
    } finally {
      setMembershipActionGroupId(null);
    }
  };

  const handleMemberStatus = async (
    group: Group,
    member: GroupMember,
    status: 'accepted' | 'rejected'
  ) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setMemberActionId(member.id);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${group.id}/members/${member.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            'Gagal memproses permintaan anggota.'
          )
        );
      }

      showSuccess(
        payload.message || 'Permintaan anggota berhasil diproses.'
      );

      await fetchGroups(true);
      await fetchGroupDetail(group.id);
    } catch (error) {
      console.error('Gagal memproses anggota:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal memproses permintaan anggota.'
      );
    } finally {
      setMemberActionId(null);
    }
  };

  const openDeleteConfirmation = (group: Group) => {
    setGroupToDelete(group);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setDeleting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, 'Gagal menghapus grup.')
        );
      }

      setShowDeleteModal(false);
      setGroupToDelete(null);
      setSelectedGroup(null);

      showSuccess(payload.message || 'Grup berhasil dihapus.');

      await fetchGroups(true);
    } catch (error) {
      console.error('Gagal menghapus grup:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus grup.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const acceptedMemberCount = (group: Group) =>
    group.members?.filter(
      (member) => member.status === 'accepted'
    ).length || 0;

  const getCurrentMembership = (group: Group) =>
    group.members?.find(
      (member) => member.user_id === currentUserId
    );

  const canManageGroup = (group: Group) => {
    if (!currentUserId) {
      return false;
    }

    if (group.creator_id === currentUserId) {
      return true;
    }

    return Boolean(
      group.members?.some(
        (member) =>
          member.user_id === currentUserId &&
          member.role === 'admin' &&
          member.status === 'accepted'
      )
    );
  };

  const filteredGroups = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return groups;
    }

    return groups.filter((group) => {
      return (
        group.name.toLowerCase().includes(keyword) ||
        (group.subject?.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (group.subject?.code || '')
          .toLowerCase()
          .includes(keyword) ||
        (group.description || '')
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [groups, searchTerm]);

  const totalMembers = groups.reduce(
    (total, group) => total + acceptedMemberCount(group),
    0
  );

  const privateGroups = groups.filter(
    (group) => group.is_private
  ).length;

  const joinedGroups = groups.filter((group) => {
    return getCurrentMembership(group)?.status === 'accepted';
  }).length;

  const selectedAcceptedMembers =
    selectedGroup?.members?.filter(
      (member) => member.status === 'accepted'
    ) || [];

  const selectedPendingMembers =
    selectedGroup?.members?.filter(
      (member) => member.status === 'pending'
    ) || [];

  const selectedMembership = selectedGroup
    ? getCurrentMembership(selectedGroup)
    : undefined;

  const selectedCanManage = selectedGroup
    ? canManageGroup(selectedGroup)
    : false;

  const selectedIsCreator = selectedGroup
    ? currentUserId === selectedGroup.creator_id
    : false;

  return (
    <div className="w-full space-y-6 pb-8">
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
                Temukan grup belajar, kelola komunitas, dan proses
                permintaan anggota dari satu halaman.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchGroups(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={subjects.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Baru
            </button>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Terjadi kesalahan</p>
              <p className="mt-0.5 text-xs text-red-600">
                {errorMsg}
              </p>
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Grup"
          value={groups.length}
          note="Komunitas belajar tersedia"
          icon={<Users className="h-5 w-5" />}
        />
        <SummaryCard
          label="Grup Saya"
          value={joinedGroups}
          note="Grup yang sedang diikuti"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total Anggota"
          value={totalMembers}
          note="Akumulasi anggota aktif"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <SummaryCard
          label="Grup Privat"
          value={privateGroups}
          note="Grup dengan persetujuan admin"
          icon={<Lock className="h-5 w-5" />}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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
            {searchTerm ? 'Grup tidak ditemukan' : 'Belum ada grup belajar'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            {searchTerm
              ? 'Coba gunakan kata kunci lain untuk menemukan grup yang sesuai.'
              : 'Jadilah yang pertama membuat komunitas belajar.'}
          </p>

          {!searchTerm && subjects.length > 0 && (
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
            const membership = getCurrentMembership(group);
            const isJoined = membership?.status === 'accepted';
            const isPending = membership?.status === 'pending';
            const memberCount = acceptedMemberCount(group);
            const isFull = memberCount >= group.max_members;
            const canManage = canManageGroup(group);
            const isMembershipLoading =
              membershipActionGroupId === group.id;

            return (
              <article
                key={group.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
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

                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-500">
                    {group.description || 'Tidak ada deskripsi grup.'}
                  </p>

                  <div className="mt-5 space-y-3">
                    <InfoRow
                      label="Ketua"
                      value={group.creator?.name || 'Anonim'}
                      icon={<Crown className="h-3.5 w-3.5 text-amber-500" />}
                    />
                    <InfoRow
                      label="Anggota"
                      value={`${memberCount} / ${group.max_members}`}
                      icon={<Users className="h-3.5 w-3.5 text-blue-500" />}
                      danger={isFull}
                    />
                    <InfoRow
                      label="Akses"
                      value={group.is_private ? 'Privat' : 'Publik'}
                      icon={
                        group.is_private ? (
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-emerald-500" />
                        )
                      }
                    />
                  </div>

                  {isPending && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-medium text-amber-700">
                      <Clock className="h-4 w-4 shrink-0" />
                      Menunggu persetujuan admin
                    </div>
                  )}

                  <div className="mt-auto pt-5">
                    <div className="flex items-center gap-2">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => openDetailModal(group)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Kelola Grup
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleJoin(group)}
                          disabled={
                            isMembershipLoading ||
                            (!isJoined && !isPending && isFull)
                          }
                          className={[
                            'flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition',
                            isPending
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : isJoined
                                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : isFull
                                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                                  : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
                          ].join(' ')}
                        >
                          {isMembershipLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPending ? (
                            <X className="h-4 w-4" />
                          ) : isJoined ? (
                            <LogOut className="h-4 w-4" />
                          ) : isFull ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}

                          {isMembershipLoading
                            ? 'Memproses...'
                            : isPending
                              ? 'Batalkan Permintaan'
                              : isJoined
                                ? 'Keluar Grup'
                                : isFull
                                  ? 'Grup Penuh'
                                  : group.is_private
                                    ? 'Ajukan Bergabung'
                                    : 'Gabung Grup'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetailModal(group)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        title="Lihat detail grup"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {canManage
                          ? 'Anda mengelola grup ini'
                          : group.is_private
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

      {showFormModal && (
        <ModalOverlay>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  {formMode === 'create' ? 'Create Community' : 'Update Community'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {formMode === 'create'
                    ? 'Buat Grup Belajar'
                    : 'Edit Grup Belajar'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setFormError(null);
                }}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveGroup}
              className="space-y-5 p-5 sm:p-6"
            >
              {formError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">
                    {formError}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Nama Grup
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={groupForm.name}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Study Buddy Basis Data"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Mata Kuliah
                </label>
                <select
                  required
                  value={groupForm.subject_id}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      subject_id: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Pilih mata kuliah</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code
                        ? `${subject.code} — ${subject.name}`
                        : subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Deskripsi
                </label>
                <textarea
                  rows={4}
                  value={groupForm.description}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Jelaskan tujuan belajar dan materi yang akan dibahas..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Maksimal Anggota
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    required
                    value={groupForm.max_members}
                    onChange={(event) =>
                      setGroupForm((current) => ({
                        ...current,
                        max_members: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Privasi
                  </label>
                  <select
                    value={groupForm.is_private ? 'private' : 'public'}
                    onChange={(event) =>
                      setGroupForm((current) => ({
                        ...current,
                        is_private: event.target.value === 'private',
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="public">Publik — langsung bergabung</option>
                    <option value="private">Privat — perlu persetujuan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">
                    Kelola grup sesuai kebutuhan belajar
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-blue-600">
                    Pada grup privat, anggota baru harus mendapat persetujuan admin sebelum menjadi anggota aktif.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : formMode === 'create' ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}

                  {submitting
                    ? 'Menyimpan...'
                    : formMode === 'create'
                      ? 'Buat Grup'
                      : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {showDetailModal && selectedGroup && (
        <ModalOverlay>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-600">
                    {selectedGroup.subject?.code || 'SUBJECT'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                      selectedGroup.is_private
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {selectedGroup.is_private ? 'Privat' : 'Publik'}
                  </span>
                </div>

                <h3 className="mt-2 truncate text-xl font-bold text-slate-900">
                  {selectedGroup.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedGroup.subject?.name || 'Mata kuliah tidak tersedia'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    Memuat detail grup...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-6">
                {selectedCanManage && (
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                    <div className="mr-auto flex items-center gap-2 px-1 text-xs font-semibold text-blue-700">
                      <ShieldCheck className="h-4 w-4" />
                      Anda memiliki akses pengelola
                    </div>
                    {selectedIsCreator && (
                      <button
                        type="button"
                        onClick={() => openSessionModal(selectedGroup)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Buat Sesi Belajar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedGroup)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Grup
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirmation(selectedGroup)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DetailStat
                    label="Ketua"
                    value={selectedGroup.creator?.name || 'Anonim'}
                    icon={<Crown className="h-4 w-4 text-amber-500" />}
                  />
                  <DetailStat
                    label="Anggota Aktif"
                    value={`${selectedAcceptedMembers.length} / ${selectedGroup.max_members}`}
                    icon={<Users className="h-4 w-4 text-blue-500" />}
                  />
                  <DetailStat
                    label="Permintaan"
                    value={String(selectedPendingMembers.length)}
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Deskripsi
                  </h4>
                  <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                    {selectedGroup.description || 'Tidak ada deskripsi grup.'}
                  </p>
                </div>

                {selectedMembership?.status === 'pending' && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">
                          Permintaan sedang menunggu persetujuan
                        </p>
                        <p className="mt-1 text-[10px] text-amber-700">
                          Kamu dapat membatalkan permintaan selama belum diproses admin.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleJoin(selectedGroup)}
                      disabled={membershipActionGroupId === selectedGroup.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      {membershipActionGroupId === selectedGroup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Batalkan
                    </button>
                  </div>
                )}

                {!selectedCanManage &&
                  selectedMembership?.status === 'accepted' && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">
                            Kamu adalah anggota aktif
                          </p>
                          <p className="mt-1 text-[10px] text-emerald-700">
                            Kamu dapat keluar dari grup kapan saja.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleJoin(selectedGroup)}
                        disabled={membershipActionGroupId === selectedGroup.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {membershipActionGroupId === selectedGroup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        Keluar Grup
                      </button>
                    </div>
                  )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Anggota Aktif
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400">
                      {selectedAcceptedMembers.length} anggota
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedAcceptedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                            {member.user?.profile?.avatar_url ? (
                              <img
                                src={member.user.profile.avatar_url}
                                alt={`Foto profil ${member.user.name}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              member.user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {member.user?.name || 'Pengguna'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {member.user_id === selectedGroup.creator_id
                                ? 'Creator grup'
                                : member.role === 'admin'
                                  ? 'Admin grup'
                                  : 'Anggota'}
                            </p>
                          </div>
                        </div>

                        {member.role === 'admin' && (
                          <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCanManage && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Permintaan Bergabung
                      </h4>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                        {selectedPendingMembers.length} pending
                      </span>
                    </div>

                    {selectedPendingMembers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                        Tidak ada permintaan bergabung yang menunggu.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPendingMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-bold text-amber-600 shadow-sm">
                                {member.user?.profile?.avatar_url ? (
                                  <img
                                    src={member.user.profile.avatar_url}
                                    alt={`Foto profil ${member.user.name}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  member.user?.name?.charAt(0).toUpperCase() || 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800">
                                  {member.user?.name || 'Pengguna'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-amber-600">
                                  Menunggu persetujuan
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleMemberStatus(
                                    selectedGroup,
                                    member,
                                    'accepted'
                                  )
                                }
                                disabled={memberActionId === member.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-none"
                              >
                                {memberActionId === member.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                Terima
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleMemberStatus(
                                    selectedGroup,
                                    member,
                                    'rejected'
                                  )
                                }
                                disabled={memberActionId === member.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Tolak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ModalOverlay>
      )}

      {showSessionModal && sessionGroup && (
        <ModalOverlay>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Buat Sesi Belajar
                    </h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Grup: {sessionGroup.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSessionModal(false);
                  setSessionGroup(null);
                  setSessionError(null);
                }}
                disabled={savingSession}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 p-5 sm:p-6">
              {sessionError && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{sessionError}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Judul Sesi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Belajar Laravel Routing"
                  disabled={savingSession}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Deskripsi
                </label>
                <textarea
                  value={sessionForm.description}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Topik atau agenda yang akan dibahas..."
                  rows={3}
                  disabled={savingSession}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Link Google Meet / Zoom
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={sessionForm.meeting_link}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        meeting_link: event.target.value,
                      }))
                    }
                    placeholder="https://meet.google.com/..."
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={getLocalDateValue()}
                    value={sessionForm.date}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Jam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Maks. Peserta
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={sessionForm.max_participants}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        max_participants: Number(event.target.value),
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={sessionForm.duration_minutes}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        duration_minutes: Number(event.target.value),
                      }))
                    }
                    disabled={savingSession}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-3 text-[10px] leading-5 text-blue-700">
                Hanya ketua grup yang dapat membuat sesi. Setelah dibuat, sesi dapat dilihat anggota aktif melalui menu Kalender.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    setSessionGroup(null);
                    setSessionError(null);
                  }}
                  disabled={savingSession}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSession ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}
                  {savingSession ? 'Menyimpan...' : 'Buat Sesi'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {showDeleteModal && groupToDelete && (
        <ModalOverlay>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Hapus Grup?
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Grup <span className="font-bold text-slate-700">{groupToDelete.name}</span>{' '}
              akan dihapus permanen. Membership dan sesi belajar yang terkait
              dengan grup ini juga akan terhapus.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setGroupToDelete(null);
                }}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-[11px] text-slate-500">
        {icon}
        {label}
      </span>
      <span
        className={`max-w-[160px] truncate text-[11px] font-semibold ${
          danger ? 'text-red-600' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DetailStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
