import type { ChangeEvent, FormEvent } from 'react';
import AvatarImage from '@/components/ui/AvatarImage';
import {
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
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
import type { AvailabilityDto, LearningStyle, SubjectDto } from '@/types/api';
import { DAYS, LEARNING_STYLES, type ProfileForm } from './utils';
import TextField from './TextField';
type ProfileEditorProps = {
  formData: ProfileForm;
  subjects: SubjectDto[];
  selectedSubjectIds: number[];
  learningStyles: LearningStyle[];
  availabilities: AvailabilityDto[];
  displayedAvatar: string | null;
  initials: string;
  saving: boolean;
  fileInputRef: { current: HTMLInputElement | null };
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  updateField: (field: keyof ProfileForm, value: string) => void;
  toggleSubject: (subjectId: number) => void;
  toggleLearningStyle: (style: LearningStyle) => void;
  addAvailability: () => void;
  updateAvailability: (index: number, field: keyof AvailabilityDto, value: string | number | boolean) => void;
  removeAvailability: (index: number) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
export default function ProfileEditor({ formData, subjects, selectedSubjectIds, learningStyles, availabilities, displayedAvatar, initials, saving, fileInputRef, handleAvatarChange, updateField, toggleSubject, toggleLearningStyle, addAvailability, updateAvailability, removeAvailability, handleSubmit }: ProfileEditorProps) {
  return (
    <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]"
          >
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-md">
                    {displayedAvatar ? (
                      <AvatarImage
                        src={displayedAvatar}
                        alt="Foto profil"
                        sizes="112px"
                        className="object-cover"
                        fallback={initials}
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
  );
}
