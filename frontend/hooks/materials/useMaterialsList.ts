import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL, getAccessToken } from '@/lib/auth';
import type { Material, MaterialsResponse } from '@/components/materials/types';

export function useMaterialsList() {
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedMaterials, setHasLoadedMaterials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalMaterials, setTotalMaterials] = useState(0);

  const [error, setError] = useState('');
  const [materialsLoadError, setMaterialsLoadError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = (message: string) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const fetchMaterials = useCallback(
    async (page = 1) => {
      const token = getAccessToken();

      if (!token) {
        router.push('/login');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        params.append('page', String(page));

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        const response = await fetch(
          `${API_URL}/materials?${params.toString()}`,
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
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
        if (!response.ok) {
          const errorBody: {
            message?: string;
          } | null = await response.json().catch(() => null);
          const errorMessage =
            typeof errorBody?.message === 'string' &&
            errorBody.message.trim() !== ''
              ? errorBody.message
              : `Gagal mengambil data materi (${response.status})`;
          throw new Error(errorMessage);
        }
        const result: MaterialsResponse = await response.json();

        setMaterials(Array.isArray(result.data) ? result.data : []);
        setMaterialsLoadError('');
        setHasLoadedMaterials(true);

        const pagination = result.pagination ?? result.meta ?? result;
        setCurrentPage(pagination.current_page || 1);
        setLastPage(pagination.last_page || 1);
        setTotalMaterials(pagination.total || 0);
      } catch (err) {
        console.warn(
          'Gagal memuat daftar materi:',
          err instanceof Error ? err.message : 'Koneksi gagal.'
        );
        setMaterialsLoadError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data materi.'
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data materi.'
        );
      } finally {
        setLoading(false);
      }
    },
    [router, searchQuery]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchMaterials]);

  const handlePageChange = (page: number) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    fetchMaterials(page);
  };

  return {
    materials,
    loading,
    hasLoadedMaterials,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    lastPage,
    totalMaterials,
    error,
    setError,
    materialsLoadError,
    success,
    showSuccess,
    fetchMaterials,
    handlePageChange,
  };
}
