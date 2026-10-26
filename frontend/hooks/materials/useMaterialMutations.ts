import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL, getAccessToken } from '@/lib/auth';
import type { Material } from '@/components/materials/types';

interface UseMaterialMutationsParams {
  materials: Material[];
  currentPage: number;
  fetchMaterials: (page?: number) => Promise<void>;
  setError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export function useMaterialMutations({
  materials,
  currentPage,
  fetchMaterials,
  setError,
  showSuccess,
}: UseMaterialMutationsParams) {
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    file: null as File | null,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      description: '',
      file: null,
    });
  };

  const openCreateModal = () => {
    setEditingMaterial(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (material: Material) => {
    if (!material.is_owner) return;

    setEditingMaterial(material);
    setFormData({
      title: material.title,
      subject: material.subject,
      description: material.description || '',
      file: null,
    });
    setIsModalOpen(true);
  };

  const closeMaterialModal = () => {
    if (uploading) return;

    setIsModalOpen(false);
    setEditingMaterial(null);
    resetForm();
  };

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

    if (!editingMaterial && !formData.file) {
      alert('Silakan pilih file materi terlebih dahulu.');
      return;
    }

    const token = getAccessToken();

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
      if (formData.file) {
        uploadData.append('file', formData.file);
      }

      const requestUrl = editingMaterial
        ? `${API_URL}/materials/${editingMaterial.id}`
        : `${API_URL}/materials`;

      if (editingMaterial) {
        // Laravel method spoofing menjaga upload file tetap kompatibel
        // saat endpoint update menggunakan PATCH.
        uploadData.append('_method', 'PATCH');
      }

      const response = await fetch(requestUrl, {
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

      const successMessage = editingMaterial
        ? 'Materi berhasil diperbarui.'
        : 'Materi berhasil diunggah.';

      resetForm();
      setEditingMaterial(null);
      setIsModalOpen(false);

      showSuccess(successMessage);

      await fetchMaterials(editingMaterial ? currentPage : 1);
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
    const token = getAccessToken();

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

  const handleDelete = async (material: Material) => {
    if (!material.is_owner) return;

    const token = getAccessToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setDeletingId(material.id);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/materials/${material.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menghapus materi.'
        );
      }

      showSuccess(
        result.message || 'Materi berhasil dihapus.'
      );

      setMaterialToDelete(null);

      const targetPage =
        materials.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      await fetchMaterials(targetPage);
    } catch (err) {
      console.error('Gagal menghapus materi:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus materi.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return {
    uploading,
    downloadingId,
    deletingId,
    isModalOpen,
    editingMaterial,
    materialToDelete,
    setMaterialToDelete,
    formData,
    openCreateModal,
    openEditModal,
    closeMaterialModal,
    handleInputChange,
    handleFileChange,
    handleSubmit,
    handleDownload,
    handleDelete,
  };
}
