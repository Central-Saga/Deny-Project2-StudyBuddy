import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ModalOverlay,
} from './parts';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'subjects'
  | 'submitting'
  | 'formError'
  | 'setFormError'
  | 'showFormModal'
  | 'setShowFormModal'
  | 'formMode'
  | 'groupForm'
  | 'setGroupForm'
  | 'handleSaveGroup'
>;

export default function GroupFormModal({
  subjects,
  submitting,
  formError,
  setFormError,
  showFormModal,
  setShowFormModal,
  formMode,
  groupForm,
  setGroupForm,
  handleSaveGroup,
}: Props) {
  return (
    <>
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
    </>
  );
}
