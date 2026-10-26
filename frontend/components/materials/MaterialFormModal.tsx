import { Loader2, Upload, X } from 'lucide-react';
import type { Material } from './types';

interface MaterialFormModalProps {
  editingMaterial: Material | null;
  uploading: boolean;
  formData: {
    title: string;
    subject: string;
    description: string;
    file: File | null;
  };
  closeMaterialModal: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MaterialFormModal({
  editingMaterial,
  uploading,
  formData,
  closeMaterialModal,
  handleSubmit,
  handleInputChange,
  handleFileChange,
}: MaterialFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
              Study Materials
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {editingMaterial ? 'Edit Materi' : 'Unggah Materi'}
            </h3>
          </div>

          <button
            type="button"
            onClick={closeMaterialModal}
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
              {editingMaterial
                ? 'Ganti File Materi'
                : 'File Materi'}
              {!editingMaterial && (
                <span className="ml-1 text-red-500">
                  *
                </span>
              )}
            </label>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50/30">
              <input
                type="file"
                required={!editingMaterial}
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
                  : editingMaterial
                    ? 'Opsional: pilih file baru untuk mengganti file lama'
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
              onClick={closeMaterialModal}
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
                ? editingMaterial
                  ? 'Menyimpan...'
                  : 'Mengunggah...'
                : editingMaterial
                  ? 'Simpan Perubahan'
                  : 'Simpan & Unggah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
