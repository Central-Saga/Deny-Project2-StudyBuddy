'use client';
import { API_URL, clearAuthSession } from '@/lib/auth';
import { apiFetch as fetch } from '@/lib/api-fetch';
import ProfileEditor from './ProfileEditor';
import { emptyForm, getValidationMessage, userToForm, type MeResponse, type ProfileForm, type UpdateProfileResponse } from './utils';
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { AvailabilityDto, LearningStyle, SubjectDto, UserDto } from '@/types/api';
function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
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
  const [profileLoadError, setProfileLoadError] = useState('');
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
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
      clearAuthSession();
      router.replace('/login');
      return;
    }
setLoading(true);
    setErrorMsg('');
    setProfileLoadError('');
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
        clearAuthSession();
        router.replace('/login');
        return;
      }
if (!profileResponse.ok) {
        throw new Error('Gagal memuat data profil.');
      }
if (!subjectResponse.ok) {
        throw new Error('Gagal memuat daftar mata kuliah.');
      }
const profilePayload: MeResponse | null =
        await profileResponse.json().catch(() => null);
const subjectPayload: unknown =
        await subjectResponse.json().catch(() => null);
if (!profilePayload?.user) {
        throw new Error('Data pengguna dari server tidak valid.');
      }
const subjectList = Array.isArray(subjectPayload)
        ? subjectPayload
        : subjectPayload &&
            typeof subjectPayload === 'object' &&
            'data' in subjectPayload &&
            Array.isArray(subjectPayload.data)
          ? subjectPayload.data
          : null;
if (!subjectList) {
        throw new Error('Data mata kuliah dari server tidak valid.');
      }
setSubjects(subjectList);
      applyUser(profilePayload.user);
localStorage.setItem(
        'user_data',
        JSON.stringify(profilePayload.user)
      );
window.dispatchEvent(new Event('user-data-updated'));
setHasLoadedProfile(true);
      setProfileLoadError('');
    } catch (error) {
      console.warn(
        'Profile API:',
        error instanceof Error ? error.message : 'Koneksi gagal.'
      );
setProfileLoadError(
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
      clearAuthSession();
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
const profilePayload: UpdateProfileResponse = await profileResponse.json().catch(() => ({}));
if (profileResponse.status === 401) {
        clearAuthSession();
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
const avatarPayload: UpdateProfileResponse = await avatarResponse.json().catch(() => ({}));
if (avatarResponse.status === 401) {
          clearAuthSession();
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
if (profileLoadError && !hasLoadedProfile) {
    return (
      <div
        role="alert"
        className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"
      >
        <AlertCircle className="h-11 w-11 text-red-500" />
<h2 className="mt-4 text-lg font-bold text-slate-800">
          Data profil belum dapat dimuat
        </h2>
<p className="mt-2 max-w-md text-sm text-slate-500">
          {profileLoadError}
        </p>
<button
          type="button"
          onClick={() => void fetchProfile()}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }
return (
    <div className="w-full space-y-6">
      {profileLoadError && hasLoadedProfile && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <p className="font-semibold">
            Gagal memperbarui data profil dari server.
          </p>
          <p className="mt-1">
            Data pada formulir tetap dipertahankan.
          </p>
        </div>
      )}
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
<ProfileEditor formData={formData} subjects={subjects} selectedSubjectIds={selectedSubjectIds} learningStyles={learningStyles} availabilities={availabilities} displayedAvatar={displayedAvatar} initials={initials} saving={saving} fileInputRef={fileInputRef} handleAvatarChange={handleAvatarChange} updateField={updateField} toggleSubject={toggleSubject} toggleLearningStyle={toggleLearningStyle} addAvailability={addAvailability} updateAvailability={updateAvailability} removeAvailability={removeAvailability} handleSubmit={handleSubmit} />
    </div>
  );
}
