'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  X,
  Upload,
  Download,
  User,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface Material {
  id: number;
  title: string;
  course: string;
  uploader: string;
  date: string;
  fileSize: string;
  description: string;
  fileName?: string;
  fileData?: string; // Menyimpan Base64 Data URL asli
  fileType?: string; // Menyimpan MIME type asli file
}

const DEFAULT_MATERIALS: Material[] = [
  {
    id: 1,
    title: 'Rangkuman Basis Data Lanjut - Normalisasi & SQL',
    course: 'Basis Data',
    uploader: 'I Kadek Deny',
    date: '20 Sep 2026',
    fileSize: '2.4 MB (PDF)',
    fileName: 'Rangkuman_Basis_Data.pdf',
    description: 'Catatan ringkas mengenai teknik normalisasi NF1 hingga NF3 beserta contoh query SQL.',
  },
  {
    id: 2,
    title: 'Modul Pemrograman Web Next.js 14 App Router',
    course: 'Pemrograman Web',
    uploader: 'Andi Wijaya',
    date: '18 Sep 2026',
    fileSize: '4.1 MB (PDF)',
    fileName: 'Modul_Nextjs14.pdf',
    description: 'Panduan belajar Next.js App Router, layouting, server components, dan fetching API.',
  },
];

export default function MaterialsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    description: '',
    file: null as File | null,
  });

  const fetchMaterialsFromStorage = () => {
    const savedMaterials = localStorage.getItem('study_materials');
    if (savedMaterials) {
      try {
        setMaterials(JSON.parse(savedMaterials));
      } catch (e) {
        setMaterials(DEFAULT_MATERIALS);
      }
    } else {
      setMaterials(DEFAULT_MATERIALS);
      localStorage.setItem('study_materials', JSON.stringify(DEFAULT_MATERIALS));
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchMaterialsFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'study_materials') {
        fetchMaterialsFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Batasi ukuran file lokal ke ~3.5MB agar muat di localStorage browser
      if (selectedFile.size > 3.5 * 1024 * 1024) {
        alert('Untuk penyimpanan lokal browser, batas ukuran file adalah 3.5 MB.');
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({ ...prev, file: selectedFile }));
    }
  };

  // Membaca file fisik menjadi format DataURL (Base64) tanpa mengubah format file
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.course) return;

    if (!formData.file) {
      alert('Silakan pilih file materi terlebih dahulu!');
      return;
    }

    let currentUploaderName = 'Mahasiswa';
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) currentUploaderName = parsed.name;
      } catch (e) {
        console.error('Error reading user data');
      }
    }

    try {
      // Pembacaan Data Asli File
      const fileDataUrl = await readFileAsBase64(formData.file);
      const fileName = formData.file.name;
      const fileType = formData.file.type;
      
      // Hitung Format Ukuran File & Ekstensi
      const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeMB = (formData.file.size / (1024 * 1024)).toFixed(1);
      const fileSizeFormatted = `${sizeMB} MB (${ext})`;

      const newMaterial: Material = {
        id: Date.now(),
        title: formData.title,
        course: formData.course,
        uploader: currentUploaderName,
        date: 'Hari ini',
        fileSize: fileSizeFormatted,
        fileName: fileName,
        fileData: fileDataUrl,
        fileType: fileType,
        description: formData.description || 'Tidak ada deskripsi.',
      };

      const existingRaw = localStorage.getItem('study_materials');
      let currentList: Material[] = DEFAULT_MATERIALS;
      if (existingRaw) {
        try {
          currentList = JSON.parse(existingRaw);
        } catch (e) {
          currentList = DEFAULT_MATERIALS;
        }
      }

      const updatedList = [newMaterial, ...currentList];

      localStorage.setItem('study_materials', JSON.stringify(updatedList));
      setMaterials(updatedList);
      showNotification('Materi berhasil diunggah!');

      setFormData({ title: '', course: '', description: '', file: null });
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal memproses file. Pastikan ukuran file tidak melebihi batas.');
    }
  };

  // Fungsi Mengunduh File Asli Sesuai Ekstensi Aslinya
  const handleDownload = (item: Material) => {
    if (item.fileData) {
      const link = document.createElement('a');
      link.href = item.fileData;
      link.download = item.fileName || `${item.title}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`Mengunduh ${item.fileName || item.title}...`);
    } else {
      // Fallback untuk data dummy awal jika belum ada file terunggah
      alert(`Ini adalah sampel data demo "${item.fileName}". Unggah file asli kamu (PDF/Word/PPT) untuk menguji unduhan nyata.`);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredMaterials = materials.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  return (
    <div className="space-y-6 w-full relative">
      {/* Toast Notifikasi */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Berbagi Materi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Temukan dan bagikan materi belajar dengan mudah.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Unggah Materi
        </button>
      </div>

      {/* Bar Pencarian */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul materi atau mata kuliah..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Daftar Materi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-200 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold text-[11px] rounded-full border border-blue-100">
                  {item.course}
                </span>
                <span className="text-[11px] text-slate-400">{item.date}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-[11px]">
                  Oleh: <strong className="text-slate-700">{item.uploader}</strong>
                </span>
              </div>
              
              {/* Tombol Unduh */}
              <button
                onClick={() => handleDownload(item)}
                className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Unduh ({item.fileSize})
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">
            Tidak ada materi ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Coba kata kunci lain atau unggah materi baru.
          </p>
        </div>
      )}

      {/* ================= MODAL UNGGAH MATERI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                Unggah Materi Belajar
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Rangkuman Aljabar Linier Bab 3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Kuliah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  required
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="Contoh: Basis Data, Pemrograman Web"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Jelaskan ringkasan isi materi ini..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih File (PDF, DOCX, PPTX) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 relative">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.zip,.rar,.png,.jpg,.jpeg"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-medium">
                    {formData.file
                      ? formData.file.name
                      : 'Klik untuk memilih file PDF / Word / PowerPoint / Gambar'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Maksimal ukuran file: 3.5 MB
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
                >
                  Simpan & Unggah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}