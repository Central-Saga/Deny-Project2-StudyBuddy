'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  Camera,
  CheckCircle,
  Code2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Save,
  School,
  User,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

type Subject = {
  id: number;
  code?: string | null;
  name: string;
};

type ProfileData = {
  bio?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  university?: string | null;
  major?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
};

type UserData = {
  id: number;
  name: string;
  email: string;
  course?: string | null;
  skills?: string[];
  bio?: string | null;
  profile?: ProfileData | null;
};

type MeResponse = {
  user?: UserData;
};

type UpdateProfileResponse = {
  message?: string;
  user?: UserData;
  errors?: Record<string, string[]>;
};

type FormDataState = {
  name: string;
  email: string;
  course: string;
  skills: string;
  bio: string;
  phone_number: string;
  university: string;
  major: string;
  github_url: string;
  linkedin_url: string;
};

const emptyForm: FormDataState = {
  name: '',
  email: '',
  course: '',
  skills: '',
  bio: '',
  phone_number: '',
  university: '',
  major: '',
  github_url: '',
  linkedin_url: '',
};

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

function userToForm(user: UserData): FormDataState {
  return {
    name: user.name || '',
    email: user.email || '',
    course: user.course || '',
    skills: Array.isArray(user.skills)
      ? user.skills.join(', ')
      : '',
    bio:
      user.profile?.bio ??
      user.bio ??
      '',
    phone_number:
      user.profile?.phone_number ?? '',
    university:
      user.profile?.university ?? '',
    major:
      user.profile?.major ?? '',
    github_url:
      user.profile?.github_url ?? '',
    linkedin_url:
      user.profile?.linkedin_url ?? '',
  };
}

function getValidationMessage(
  payload: UpdateProfileResponse,
  fallback: string
): string {
  if (payload.errors) {
    const messages = Object.values(
      payload.errors
    ).flat();

    if (messages.length > 0) {
      return messages[0];
    }
  }

  return payload.message || fallback;
}

export default function ProfilePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] =
    useState<FormDataState>(emptyForm);

  const [subjects, setSubjects] =
    useState<Subject[]>([]);

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [successMsg, setSuccessMsg] =
    useState('');

  const [errorMsg, setErrorMsg] =
    useState('');

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  const fetchProfile =
    useCallback(async () => {
      const token = getStoredToken();

      if (!token) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        const [
          profileResponse,
          subjectResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/me`, {
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
        ]);

        if (
          profileResponse.status === 401 ||
          subjectResponse.status === 401
        ) {
          clearAuthStorage();
          router.replace('/login');
          return;
        }

        if (!profileResponse.ok) {
          throw new Error(
            'Gagal memuat data profil.'
          );
        }

        const profilePayload: MeResponse =
          await profileResponse.json();

        if (!profilePayload.user) {
          throw new Error(
            'Data pengguna tidak ditemukan.'
          );
        }

        const user = profilePayload.user;

        setFormData(userToForm(user));

        setAvatarUrl(
          user.profile?.avatar_url || null
        );

        localStorage.setItem(
          'user_data',
          JSON.stringify(user)
        );

        window.dispatchEvent(
          new Event('user-data-updated')
        );

        if (subjectResponse.ok) {
          const subjectPayload =
            await subjectResponse.json();

          if (Array.isArray(subjectPayload)) {
            setSubjects(subjectPayload);
          } else if (
            Array.isArray(
              subjectPayload?.data
            )
          ) {
            setSubjects(
              subjectPayload.data
            );
          }
        }
      } catch (error) {
        console.error(
          'Gagal memuat profil:',
          error
        );

        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat memuat profil.'
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // =========================================================
  // CLEAN PREVIEW URL
  // =========================================================

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview]);

  // =========================================================
  // INPUT HANDLER
  // =========================================================

  function updateField(
    field: keyof FormDataState,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // =========================================================
  // AVATAR
  // =========================================================

  function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setErrorMsg(
        'Foto profil harus berformat JPG, JPEG, PNG, atau WEBP.'
      );

      event.target.value = '';
      return;
    }

    const maxSize =
      2 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMsg(
        'Ukuran foto profil maksimal 2 MB.'
      );

      event.target.value = '';
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(preview);
    setErrorMsg('');
    setSuccessMsg('');
  }

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg(
        'Nama lengkap wajib diisi.'
      );
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const skillsArray =
        formData.skills
          .split(',')
          .map((skill) =>
            skill.trim()
          )
          .filter(Boolean);

      // =====================================================
      // 1. UPDATE TEXT PROFILE
      // =====================================================

      const profileResponse =
        await fetch(
          `${API_URL}/profile`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name:
                formData.name.trim(),

              course:
                formData.course ||
                null,

              skills:
                skillsArray.length > 0
                  ? skillsArray
                  : null,

              bio:
                formData.bio.trim() ||
                null,

              phone_number:
                formData.phone_number.trim() ||
                null,

              university:
                formData.university.trim() ||
                null,

              major:
                formData.major.trim() ||
                null,

              github_url:
                formData.github_url.trim() ||
                null,

              linkedin_url:
                formData.linkedin_url.trim() ||
                null,
            }),
          }
        );

      const profilePayload: UpdateProfileResponse =
        await profileResponse.json();

      if (
        profileResponse.status === 401
      ) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      if (!profileResponse.ok) {
        throw new Error(
          getValidationMessage(
            profilePayload,
            'Gagal memperbarui profil.'
          )
        );
      }

      let updatedUser =
        profilePayload.user;

      // =====================================================
      // 2. UPLOAD AVATAR
      // =====================================================

      if (avatarFile) {
        const avatarData =
          new FormData();

        avatarData.append(
          'avatar',
          avatarFile
        );

        const avatarResponse =
          await fetch(
            `${API_URL}/profile/avatar`,
            {
              method: 'POST',

              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: avatarData,
            }
          );

        const avatarPayload: UpdateProfileResponse =
          await avatarResponse.json();

        if (
          avatarResponse.status === 401
        ) {
          clearAuthStorage();
          router.replace('/login');
          return;
        }

        if (!avatarResponse.ok) {
          throw new Error(
            getValidationMessage(
              avatarPayload,
              'Data profil tersimpan, tetapi foto gagal diunggah.'
            )
          );
        }

        updatedUser =
          avatarPayload.user ||
          updatedUser;
      }

      // =====================================================
      // 3. UPDATE LOCAL STORAGE + UI
      // =====================================================

      if (updatedUser) {
        localStorage.setItem(
          'user_data',
          JSON.stringify(
            updatedUser
          )
        );

        window.dispatchEvent(
          new Event('user-data-updated')
        );

        setFormData(
          userToForm(updatedUser)
        );

        setAvatarUrl(
          updatedUser.profile
            ?.avatar_url || null
        );
      }

      if (avatarPreview) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }

      setAvatarPreview(null);
      setAvatarFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          '';
      }

      setSuccessMsg(
        'Profil berhasil diperbarui.'
      );

      window.setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (error) {
      console.error(
        'Gagal memperbarui profil:',
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan perubahan profil.'
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DISPLAY AVATAR
  // =========================================================

  const displayedAvatar =
    avatarPreview || avatarUrl;

  const initials =
    formData.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0)
      )
      .join('')
      .toUpperCase() || 'U';

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Memuat profil
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Mengambil data profil
              terbaru...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Pengaturan Profil
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Kelola identitas, informasi
          akademik, keahlian, dan foto
          profilmu.
        </p>
      </section>

      {/* ALERT */}

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-bold">
              Terjadi kesalahan
            </p>

            <p className="mt-1">
              {errorMsg}
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="font-semibold">
            {successMsg}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]"
      >
        {/* ===============================================
            AVATAR CARD
        ================================================ */}

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-md">
                {displayedAvatar ? (
                  <Image
                    src={
                      displayedAvatar
                    }
                    alt="Foto profil"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                title="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={
                handleAvatarChange
              }
              className="hidden"
            />

            <h2 className="mt-4 text-sm font-bold text-slate-800">
              {formData.name ||
                'Mahasiswa'}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {formData.email}
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-4 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              Pilih Foto
            </button>

            <p className="mt-3 text-[10px] leading-4 text-slate-400">
              JPG, JPEG, PNG atau WEBP.
              Maksimal 2 MB.
            </p>

            {avatarFile && (
              <div className="mt-3 w-full rounded-lg bg-blue-50 px-3 py-2 text-[10px] text-blue-600">
                Foto baru dipilih.
                Klik Simpan Perubahan
                untuk mengunggahnya.
              </div>
            )}
          </div>
        </aside>

        {/* ===============================================
            PROFILE FORM
        ================================================ */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-800">
              Informasi Pribadi
            </h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Informasi ini membantu
              mahasiswa lain mengenalmu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* NAME */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Nama Lengkap
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  required
                  maxLength={255}
                  value={
                    formData.name
                  }
                  onChange={(event) =>
                    updateField(
                      'name',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="email"
                  disabled
                  value={
                    formData.email
                  }
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3 text-xs text-slate-500"
                />
              </div>
            </div>

            {/* UNIVERSITY */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Universitas
              </label>

              <div className="relative">
                <School className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  maxLength={255}
                  value={
                    formData.university
                  }
                  onChange={(event) =>
                    updateField(
                      'university',
                      event.target.value
                    )
                  }
                  placeholder="Contoh: INSTIKI"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* MAJOR */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Jurusan
              </label>

              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  maxLength={255}
                  value={
                    formData.major
                  }
                  onChange={(event) =>
                    updateField(
                      'major',
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Informatika"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* PHONE */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Nomor Telepon
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  maxLength={30}
                  value={
                    formData.phone_number
                  }
                  onChange={(event) =>
                    updateField(
                      'phone_number',
                      event.target.value
                    )
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* COURSE */}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Mata Kuliah Utama
              </label>

              <select
                value={
                  formData.course
                }
                onChange={(event) =>
                  updateField(
                    'course',
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Pilih mata kuliah
                </option>

                {subjects.map(
                  (subject) => (
                    <option
                      key={
                        subject.id
                      }
                      value={
                        subject.name
                      }
                    >
                      {subject.code
                        ? `${subject.code} - ${subject.name}`
                        : subject.name}
                    </option>
                  )
                )}

                {formData.course &&
                  !subjects.some(
                    (subject) =>
                      subject.name ===
                      formData.course
                  ) && (
                    <option
                      value={
                        formData.course
                      }
                    >
                      {
                        formData.course
                      }
                    </option>
                  )}
              </select>

              <p className="mt-1 text-[10px] text-slate-400">
                Daftar mata kuliah
                diambil dari database.
              </p>
            </div>
          </div>

          {/* SKILLS */}

          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Keahlian / Skill
            </label>

            <input
              type="text"
              value={
                formData.skills
              }
              onChange={(event) =>
                updateField(
                  'skills',
                  event.target.value
                )
              }
              placeholder="Contoh: Python, SQL, React, Laravel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-[10px] text-slate-400">
              Pisahkan setiap keahlian
              dengan koma.
            </p>
          </div>

          {/* BIO */}

          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Bio
            </label>

            <textarea
              rows={4}
              maxLength={2000}
              value={formData.bio}
              onChange={(event) =>
                updateField(
                  'bio',
                  event.target.value
                )
              }
              placeholder="Ceritakan sedikit tentang minat belajar, keahlian, atau topik yang ingin kamu kuasai..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-5 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-1 text-right text-[10px] text-slate-400">
              {
                formData.bio.length
              }
              /2000
            </div>
          </div>

          {/* SOCIAL */}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-bold text-slate-800">
              Tautan Profil
            </h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Opsional. Gunakan URL
              lengkap seperti
              https://github.com/username.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  GitHub
                </label>

                <div className="relative">
                  <Code2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="url"
                    maxLength={255}
                    value={
                      formData.github_url
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        'github_url',
                        event.target.value
                      )
                    }
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  LinkedIn
                </label>

                <input
                  type="url"
                  maxLength={255}
                  value={
                    formData.linkedin_url
                  }
                  onChange={(event) =>
                    updateField(
                      'linkedin_url',
                      event.target.value
                    )
                  }
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT */}

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? 'Menyimpan...'
                : 'Simpan Perubahan'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}