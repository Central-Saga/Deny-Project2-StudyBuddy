import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Clock,
  Crown,
  Eye,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  InfoRow,
} from './parts';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'hasLoadedGroups'
  | 'subjects'
  | 'loading'
  | 'errorMsg'
  | 'searchTerm'
  | 'membershipActionGroupId'
  | 'fetchGroups'
  | 'openDetailModal'
  | 'openCreateModal'
  | 'handleToggleJoin'
  | 'acceptedMemberCount'
  | 'getCurrentMembership'
  | 'canManageGroup'
  | 'filteredGroups'
>;

export default function GroupsContent({
  hasLoadedGroups,
  subjects,
  loading,
  errorMsg,
  searchTerm,
  membershipActionGroupId,
  fetchGroups,
  openDetailModal,
  openCreateModal,
  handleToggleJoin,
  acceptedMemberCount,
  getCurrentMembership,
  canManageGroup,
  filteredGroups,
}: Props) {
  return (
    <>
      {loading ? (
        <section className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Memuat grup belajar...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Mengambil data terbaru dari database.
            </p>
          </div>
        </section>
      ) : !hasLoadedGroups ? (
        <section
          role="alert"
          className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm"
        >
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

          <h3 className="mt-4 text-lg font-bold text-slate-800">
            Daftar grup belum dapat dimuat
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {errorMsg || 'Koneksi ke server belum tersedia.'}
          </p>

          <button
            type="button"
            onClick={() => void fetchGroups()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-700">
            {searchTerm ? 'Grup tidak ditemukan' : 'Belum ada grup belajar'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            {searchTerm
              ? 'Coba gunakan kata kunci lain untuk menemukan grup yang sesuai.'
              : 'Jadilah yang pertama membuat komunitas belajar.'}
          </p>

          {!searchTerm && subjects.length > 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Pertama
            </button>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const membership = getCurrentMembership(group);
            const isJoined = membership?.status === 'accepted';
            const isPending = membership?.status === 'pending';
            const memberCount = acceptedMemberCount(group);
            const isFull = memberCount >= group.max_members;
            const canManage = canManageGroup(group);
            const isMembershipLoading =
              membershipActionGroupId === group.id;

            return (
              <article
                key={group.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold backdrop-blur">
                        <BookOpen className="h-3 w-3" />
                        {group.subject?.code || 'SUBJECT'}
                      </div>
                      <h3 className="line-clamp-2 text-base font-bold leading-snug">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-[11px] font-medium text-blue-100">
                        {group.subject?.name || 'Mata kuliah belum tersedia'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
                      {group.is_private ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-500">
                    {group.description || 'Tidak ada deskripsi grup.'}
                  </p>

                  <div className="mt-5 space-y-3">
                    <InfoRow
                      label="Ketua"
                      value={group.creator?.name || 'Anonim'}
                      icon={<Crown className="h-3.5 w-3.5 text-amber-500" />}
                    />
                    <InfoRow
                      label="Anggota"
                      value={`${memberCount} / ${group.max_members}`}
                      icon={<Users className="h-3.5 w-3.5 text-blue-500" />}
                      danger={isFull}
                    />
                    <InfoRow
                      label="Akses"
                      value={group.is_private ? 'Privat' : 'Publik'}
                      icon={
                        group.is_private ? (
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-emerald-500" />
                        )
                      }
                    />
                  </div>

                  {isPending && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-medium text-amber-700">
                      <Clock className="h-4 w-4 shrink-0" />
                      Menunggu persetujuan admin
                    </div>
                  )}

                  <div className="mt-auto pt-5">
                    <div className="flex items-center gap-2">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => openDetailModal(group)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Kelola Grup
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleJoin(group)}
                          disabled={
                            isMembershipLoading ||
                            (!isJoined && !isPending && isFull)
                          }
                          className={[
                            'flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition',
                            isPending
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : isJoined
                                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : isFull
                                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                                  : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
                          ].join(' ')}
                        >
                          {isMembershipLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPending ? (
                            <X className="h-4 w-4" />
                          ) : isJoined ? (
                            <LogOut className="h-4 w-4" />
                          ) : isFull ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}

                          {isMembershipLoading
                            ? 'Memproses...'
                            : isPending
                              ? 'Batalkan Permintaan'
                              : isJoined
                                ? 'Keluar Grup'
                                : isFull
                                  ? 'Grup Penuh'
                                  : group.is_private
                                    ? 'Ajukan Bergabung'
                                    : 'Gabung Grup'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetailModal(group)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        title="Lihat detail grup"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {canManage
                          ? 'Anda mengelola grup ini'
                          : group.is_private
                            ? 'Memerlukan persetujuan'
                            : 'Terbuka untuk mahasiswa'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
