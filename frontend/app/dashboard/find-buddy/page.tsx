'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  Search,
  UserPlus,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api'
).replace(/\/$/, '');

interface Buddy {
  id: number;
  name: string;
  email: string;
  course: string;
  skills: string[] | string;
  bio?: string;
  is_connected?: boolean;
}

export default function FindBuddyPage() {
  const router = useRouter();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Semua');

  // Fetch Data Buddies dari API Backend
  const fetchBuddies = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (selectedCourse !== 'Semua') {
        queryParams.append('course', selectedCourse);
      }

      const res = await fetch(`${API_URL}/buddies?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Gagal mengambil data (Status: ${res.status})`);
      }

      const data = await res.json();
      setBuddies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal mengambil data buddy:', err);
      setErrorMsg('Gagal terhubung ke server backend. Pastikan server backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, router]);

  useEffect(() => {
    fetchBuddies();
  }, [fetchBuddies]);

  // Handle Kirim Permintaan Koneksi / Buddy Request
  const handleConnect = async (buddyId: number) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/buddies/${buddyId}/connect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        fetchBuddies(); // Refresh data setelah berhasil connect
      }
    } catch (err) {
      console.error('Gagal mengirim permintaan koneksi:', err);
    }
  };

  // Filter berdasarkan nama, skill, atau bio dari input pencarian
  const filteredBuddies = buddies.filter((buddy) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = buddy.name.toLowerCase().includes(term);
    const courseMatch = buddy.course?.toLowerCase().includes(term);
    
    let skillsMatch = false;
    if (Array.isArray(buddy.skills)) {
      skillsMatch = buddy.skills.some((s) => s.toLowerCase().includes(term));
    } else if (typeof buddy.skills === 'string') {
      skillsMatch = buddy.skills.toLowerCase().includes(term);
    }

    return nameMatch || courseMatch || skillsMatch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cari Study Buddy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Temukan teman belajar dengan minat, mata kuliah, atau topik keahlian yang sama.
          </p>
        </div>
      </div>

      {/* SEARCH BAR & FILTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, keahlian, atau topik..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua Matkul</option>
              <option value="Basis Data">Basis Data</option>
              <option value="Pemrograman Web">Pemrograman Web</option>
              <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
              <option value="Jaringan Komputer">Jaringan Komputer</option>
            </select>
          </div>

          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Total: <span className="font-bold text-slate-800">{filteredBuddies.length} Buddy</span>
          </p>
        </div>
      </div>

      {/* ERROR MESSAGE ALERT (Jika Backend Mati/Error) */}
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
          <p className="text-xs text-slate-500 font-medium">Mencari rekan belajar yang pas...</p>
        </div>
      ) : (
        /* BUDDY LIST GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuddies.map((buddy) => {
            const skillsList = Array.isArray(buddy.skills)
              ? buddy.skills
              : typeof buddy.skills === 'string'
              ? buddy.skills.split(',').map((s) => s.trim())
              : [];

            return (
              <div
                key={buddy.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-inner">
                        {buddy.name ? buddy.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{buddy.name}</h3>
                        <p className="text-[11px] text-slate-500">{buddy.email}</p>
                      </div>
                    </div>
                  </div>

                  {buddy.course && (
                    <span className="inline-block mt-3 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                      {buddy.course}
                    </span>
                  )}

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {buddy.bio || 'Belum menambahkan bio singkat.'}
                  </p>

                  {/* Skills Tag List */}
                  {skillsList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skillsList.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleConnect(buddy.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      buddy.is_connected
                        ? 'bg-slate-100 text-slate-600 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {buddy.is_connected ? (
                      'Terhubung'
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Ajak Belajar
                      </>
                    )}
                  </button>

                  {buddy.is_connected && (
                    <button
                      className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      title="Kirim Pesan"
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

      {!loading && !errorMsg && filteredBuddies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-600 text-sm font-semibold">Tidak Ada Study Buddy Ditemukan</p>
          <p className="text-slate-400 text-xs">Coba ubah kata kunci pencarian atau filter mata kuliah Anda.</p>
        </div>
      )}
    </div>
  );
}