'use client';

import {
  ChangeEvent,
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  CheckCircle,
  Code2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  School,
  Trash2,
  User,
} from 'lucide-react';
import type {
  AvailabilityDto,
  LearningStyle,
  SubjectDto,
  UserDto,
} from '@/types/api';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

const LEARNING_STYLES: LearningStyle[] = [
  'Visual',
  'Diskusi',
  'Membaca Mandiri',
  'Praktik Soal',
];

const DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

type ProfileForm = {
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

type MeResponse = { user?: UserDto };
type UpdateProfileResponse = {
  message?: string;
  user?: UserDto;
  errors?: Record<string, string[]>;
};

const emptyForm: ProfileForm = {
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
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

function userToForm(user: UserDto): ProfileForm {
  return {
    name: user.name || '',
    email: user.email || '',
    course: user.course || '',
    skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
    bio: user.profile?.bio ?? user.bio ?? '',
    phone_number: user.profile?.phone_number ?? '',
    university: user.profile?.university ?? '',
    major: user.profile?.major ?? '',
    github_url: user.profile?.github_url ?? '',
    linkedin_url: user.profile?.linkedin_url ?? '',
  };
}

function getValidationMessage(
  payload: UpdateProfileResponse,
  fallback: string
): string {
  if (payload.errors) {
    const messages = Object.values(payload.errors).flat();
    if (messages.length > 0) return messages[0];
  }
  return payload.message || fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<ProfileForm>(emptyForm);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>([]);
  const [availabilities, setAvailabilities] = useState<AvailabilityDto[]>([]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const applyUser = useCallback((user: UserDto) => {
    setFormData(userToForm(user));
    setAvatarUrl(user.profile?.avatar_url || null);
    setSelectedSubjectIds((user.subjects || []).map((subject) => subject.id));
    setLearningStyles(user.learning_styles || []);
    setAvailabilities(
      (user.availabilities || []).map((item) => ({
        id: item.id,
        day_of_week: item.day_of_week,
        start_time: item.start_time?.slice(0, 5) || '18:00',
        end_time: item.end_time?.slice(0, 5) || '20:00',
        timezone: item.timezone || 'Asia/Jakarta',
        is_recurring: item.is_recurring ?? true,
      }))
    );
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const [profileResponse, subjectResponse] = await Promise.all([
        fetch(`${API_URL}/me`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/subjects`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
      ]);

      if (profileResponse.status === 401 || subjectResponse.status === 401) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      if (!profileResponse.ok) {
        throw new Error('Gagal memuat data profil.');
      }

      const profilePayload: MeResponse = await profileResponse.json();
      if (!profilePayload.user) {
        throw new Error('Data pengguna tidak ditemukan.');
      }

      applyUser(profilePayload.user);
      localStorage.setItem('user_data', JSON.stringify(profilePayload.user));
      window.dispatchEvent(new Event('user-data-updated'));

      if (subjectResponse.ok) {
        const payload = await subjectResponse.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setSubjects(list);
      }
    } catch (error) {
      console.error('Gagal memuat profil:', error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat memuat profil.'
      );
    } finally {
      setLoading(false);
    }
  }, [applyUser, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function updateField(field: keyof ProfileForm, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function toggleSubject(subjectId: number) {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }

  function toggleLearningStyle(style: LearningStyle) {
    setLearningStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    );
  }

  function addAvailability() {
    setAvailabilities((current) => [
      ...current,
      {
        day_of_week: 1,
        start_time: '18:00',
        end_time: '20:00',
        timezone: 'Asia/Jakarta',
        is_recurring: true,
      },
    ]);
  }

  function updateAvailability(
    index: number,
    field: keyof AvailabilityDto,
    value: string | number | boolean
  ) {
    setAvailabilities((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeAvailability(index: number) {
    setAvailabilities((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Foto profil harus berformat JPG, JPEG, PNG, atau WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto profil maksimal 2 MB.');
      event.target.value = '';
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrorMsg('');
    setSuccessMsg('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    const invalidSchedule = availabilities.some(
      (item) => item.end_time <= item.start_time
    );
    if (invalidSchedule) {
      setErrorMsg('Jam selesai availability harus setelah jam mulai.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      const profileResponse = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          course: formData.course || null,
          skills: skillsArray,
          bio: formData.bio.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          university: formData.university.trim() || null,
          major: formData.major.trim() || null,
          github_url: formData.github_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          learning_styles: learningStyles,
          subject_ids: selectedSubjectIds,
          availabilities: availabilities.map((item) => ({
            day_of_week: item.day_of_week,
            start_time: item.start_time.slice(0, 5),
            end_time: item.end_time.slice(0, 5),
            timezone: item.timezone || 'Asia/Jakarta',
            is_recurring: item.is_recurring ?? true,
          })),
        }),
      });

      const profilePayload: UpdateProfileResponse = await profileResponse.json();

      if (profileResponse.status === 401) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      if (!profileResponse.ok) {
        throw new Error(
          getValidationMessage(profilePayload, 'Gagal memperbarui profil.')
        );
      }

      let updatedUser = profilePayload.user;

      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append('avatar', avatarFile);

        const avatarResponse = await fetch(`${API_URL}/profile/avatar`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: avatarData,
        });

        const avatarPayload: UpdateProfileResponse = await avatarResponse.json();

        if (avatarResponse.status === 401) {
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

        updatedUser = avatarPayload.user || updatedUser;
      }

      if (updatedUser) {
        applyUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-data-updated'));
      } else {
        await fetchProfile();
      }

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSuccessMsg('Profil dan preferensi Study Buddy berhasil diperbarui.');
      window.setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Gagal memperbarui profil:', error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan perubahan profil.'
      );
    } finally {
      setSaving(false);
    }
  }

  const displayedAvatar = avatarPreview || avatarUrl;
  const initials =
    formData.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-700">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Pengaturan Profil</h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Lengkapi identitas dan preferensi belajar agar pencarian Study Buddy lebih relevan.
        </p>
      </section>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]"
      >
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-md">
                {displayedAvatar ? (
                  <Image
                    src={displayedAvatar}
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
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md hover:bg-blue-700"
                title="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <h2 className="mt-4 text-sm font-bold text-slate-800">
              {formData.name || 'Mahasiswa'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{formData.email}</p>
            <p className="mt-4 text-[10px] leading-4 text-slate-400">
              JPG, PNG, atau WEBP. Maksimal 2 MB.
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Informasi Pribadi</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                label="Nama Lengkap"
                value={formData.name}
                onChange={(value) => updateField('name', value)}
                icon={<User className="h-4 w-4" />}
                required
              />
              <TextField
                label="Email"
                value={formData.email}
                onChange={() => undefined}
                icon={<Mail className="h-4 w-4" />}
                disabled
              />
              <TextField
                label="Universitas"
                value={formData.university}
                onChange={(value) => updateField('university', value)}
                icon={<School className="h-4 w-4" />}
                placeholder="Contoh: INSTIKI"
              />
              <TextField
                label="Jurusan"
                value={formData.major}
                onChange={(value) => updateField('major', value)}
                icon={<GraduationCap className="h-4 w-4" />}
                placeholder="Contoh: Informatika"
              />
              <TextField
                label="Nomor Telepon"
                value={formData.phone_number}
                onChange={(value) => updateField('phone_number', value)}
                icon={<Phone className="h-4 w-4" />}
                placeholder="081234567890"
              />

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Mata Kuliah Utama
                </label>
                <select
                  value={formData.course}
                  onChange={(event) => updateField('course', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Pilih mata kuliah</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Keahlian / Skill
              </label>
              <input
                value={formData.skills}
                onChange={(event) => updateField('skills', event.target.value)}
                placeholder="Python, SQL, React, Laravel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Bio
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                value={formData.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-5 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ceritakan minat belajar atau topik yang ingin kamu kuasai..."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Mata Kuliah untuk Matching</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pilih satu atau lebih mata kuliah yang sedang kamu pelajari.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {subjects.map((subject) => {
                const active = selectedSubjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Gaya Belajar</h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pilih gaya belajar yang paling sesuai denganmu.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {LEARNING_STYLES.map((style) => {
                const active = learningStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleLearningStyle(style)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      active
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Availability</h2>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Jadwal ini digunakan untuk mencari buddy dengan waktu belajar yang overlap.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addAvailability}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {availabilities.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                  Belum ada jadwal availability.
                </div>
              )}

              {availabilities.map((item, index) => (
                <div
                  key={`${item.id ?? 'new'}-${index}`}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <select
                    value={item.day_of_week}
                    onChange={(event) =>
                      updateAvailability(index, 'day_of_week', Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    {DAYS.map((day, dayIndex) => (
                      <option key={day} value={dayIndex}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={item.start_time.slice(0, 5)}
                    onChange={(event) =>
                      updateAvailability(index, 'start_time', event.target.value)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    type="time"
                    value={item.end_time.slice(0, 5)}
                    onChange={(event) =>
                      updateAvailability(index, 'end_time', event.target.value)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeAvailability(index)}
                    className="flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-red-600 hover:bg-red-50"
                    title="Hapus jadwal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Tautan Profil</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                label="GitHub"
                value={formData.github_url}
                onChange={(value) => updateField('github_url', value)}
                icon={<Code2 className="h-4 w-4" />}
                placeholder="https://github.com/username"
                type="url"
              />
              <TextField
                label="LinkedIn"
                value={formData.linkedin_url}
                onChange={(value) => updateField('linkedin_url', value)}
                placeholder="https://linkedin.com/in/username"
                type="url"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  icon,
  placeholder,
  disabled = false,
  required = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 py-2.5 pr-3 text-xs outline-none ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${
            disabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-500'
              : 'bg-slate-50 text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
          }`}
        />
      </div>
    </div>
  );
}
