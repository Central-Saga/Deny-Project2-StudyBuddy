'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Lock,
  Globe,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface GroupMember {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  course: string;
  description: string;
  max_members: number;
  is_private: boolean;
  schedule: string;
  leader: GroupMember;
  members: GroupMember[];
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Form State Buat Grup Baru
  const [newGroup, setNewGroup] = useState({
    name: '',
    course: 'Basis Data',
    description: '',
    max_members: 10,
    is_private: false,
    schedule: 'Setiap Sabtu • 15:00 WITA',
  });

  // Fetch Data User Login & Groups dari Backend
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUserId(parsedUser.id);
      } catch (e) {
        console.error('Gagal membaca data user:', e);
      }
    }

    try {
      const res = await fetch('http://localhost:8000/api/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Gagal mengambil data (Status: ${res.status})`);
      }

      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal mengambil data grup:', err);
      setErrorMsg('Gagal terhubung ke server backend (http://localhost:8000). Pastikan server backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Toggle Join/Leave Group API
  const handleToggleJoin = async (groupId: number) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`http://localhost:8000/api/groups/${groupId}/toggle-join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        fetchGroups();
      }
    } catch (err) {
      console.error('Gagal mengubah keanggotaan grup:', err);
    }
  };

  // Submit Buat Grup Baru API
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch('http://localhost:8000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(newGroup),
      });

      if (res.ok) {
        setShowModal(false);
        setNewGroup({
          name: '',
          course: 'Basis Data',
          description: '',
          max_members: 10,
          is_private: false,
          schedule: 'Setiap Sabtu • 15:00 WITA',
        });
        fetchGroups();
      }
    } catch (err) {
      console.error('Gagal membuat grup:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Grup Belajar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Bergabung atau buat kelompok diskusi untuk belajar bersama rekan lainnya.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Grup Baru
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama grup atau mata kuliah..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-slate-500 hidden sm:block font-medium">
          Total: <span className="font-bold text-slate-800">{filteredGroups.length} Grup</span>
        </p>
      </div>

      {/* ERROR MESSAGE ALERT */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Mengambil Data Backend</p>
            <p className="mt-0.5 text-amber-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat data grup dari database...</p>
        </div>
      ) : (
        /* GROUPS LIST GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const isJoined = group.members?.some((m) => m.id === currentUserId);
            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px] mb-2">
                        {group.course}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug">{group.name}</h3>
                    </div>
                    {group.is_private ? (
                      <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg" title="Grup Privat">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg" title="Grup Publik">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {group.description || 'Tidak ada deskripsi.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                    <p>
                      <strong className="text-slate-700">Ketua Grup:</strong> {group.leader?.name || 'Anonim'}
                    </p>
                    <p>
                      <strong className="text-slate-700">Jadwal:</strong> {group.schedule || 'Belum ditentukan'}
                    </p>
                    <p>
                      <strong className="text-slate-700">Anggota:</strong> {group.members?.length || 0} / {group.max_members} Orang
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleJoin(group.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isJoined
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tergabung
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Gabung Grup
                      </>
                    )}
                  </button>

                  {isJoined && (
                    <button
                      className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      title="Buka Chat Diskusi"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !errorMsg && filteredGroups.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Belum ada grup belajar yang dibuat.</p>
        </div>
      )}

      {/* MODAL BUAT GRUP BARU */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Buat Grup Belajar Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Nama Grup</label>
                <input
                  type="text"
                  required
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Contoh: Belajar Bareng Query SQL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Mata Kuliah</label>
                <select
                  value={newGroup.course}
                  onChange={(e) => setNewGroup({ ...newGroup, course: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Basis Data">Basis Data</option>
                  <option value="Pemrograman Web">Pemrograman Web</option>
                  <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Jelaskan tujuan dan materi yang akan dibahas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan & Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}