import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  LogOut,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import {
  ModalOverlay,
  DetailStat,
} from './parts';
import AvatarImage from '@/components/ui/AvatarImage';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'loadingDetail'
  | 'showDetailModal'
  | 'setShowDetailModal'
  | 'selectedGroup'
  | 'membershipActionGroupId'
  | 'memberActionId'
  | 'openEditModal'
  | 'openSessionModal'
  | 'handleToggleJoin'
  | 'handleMemberStatus'
  | 'openDeleteConfirmation'
  | 'selectedAcceptedMembers'
  | 'selectedPendingMembers'
  | 'selectedMembership'
  | 'selectedCanManage'
  | 'selectedIsCreator'
>;

export default function GroupDetailModal({
  loadingDetail,
  showDetailModal,
  setShowDetailModal,
  selectedGroup,
  membershipActionGroupId,
  memberActionId,
  openEditModal,
  openSessionModal,
  handleToggleJoin,
  handleMemberStatus,
  openDeleteConfirmation,
  selectedAcceptedMembers,
  selectedPendingMembers,
  selectedMembership,
  selectedCanManage,
  selectedIsCreator,
}: Props) {
  return (
    <>
      {showDetailModal && selectedGroup && (
        <ModalOverlay>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-600">
                    {selectedGroup.subject?.code || 'SUBJECT'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                      selectedGroup.is_private
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {selectedGroup.is_private ? 'Privat' : 'Publik'}
                  </span>
                </div>

                <h3 className="mt-2 truncate text-xl font-bold text-slate-900">
                  {selectedGroup.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedGroup.subject?.name || 'Mata kuliah tidak tersedia'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    Memuat detail grup...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-6">
                {selectedCanManage && (
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                    <div className="mr-auto flex items-center gap-2 px-1 text-xs font-semibold text-blue-700">
                      <ShieldCheck className="h-4 w-4" />
                      Anda memiliki akses pengelola
                    </div>
                    {selectedIsCreator && (
                      <button
                        type="button"
                        onClick={() => openSessionModal(selectedGroup)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Buat Sesi Belajar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedGroup)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Grup
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirmation(selectedGroup)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DetailStat
                    label="Ketua"
                    value={selectedGroup.creator?.name || 'Anonim'}
                    icon={<Crown className="h-4 w-4 text-amber-500" />}
                  />
                  <DetailStat
                    label="Anggota Aktif"
                    value={`${selectedAcceptedMembers.length} / ${selectedGroup.max_members}`}
                    icon={<Users className="h-4 w-4 text-blue-500" />}
                  />
                  <DetailStat
                    label="Permintaan"
                    value={String(selectedPendingMembers.length)}
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Deskripsi
                  </h4>
                  <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                    {selectedGroup.description || 'Tidak ada deskripsi grup.'}
                  </p>
                </div>

                {selectedMembership?.status === 'pending' && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">
                          Permintaan sedang menunggu persetujuan
                        </p>
                        <p className="mt-1 text-[10px] text-amber-700">
                          Kamu dapat membatalkan permintaan selama belum diproses admin.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleJoin(selectedGroup)}
                      disabled={membershipActionGroupId === selectedGroup.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      {membershipActionGroupId === selectedGroup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Batalkan
                    </button>
                  </div>
                )}

                {!selectedCanManage &&
                  selectedMembership?.status === 'accepted' && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">
                            Kamu adalah anggota aktif
                          </p>
                          <p className="mt-1 text-[10px] text-emerald-700">
                            Kamu dapat keluar dari grup kapan saja.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleJoin(selectedGroup)}
                        disabled={membershipActionGroupId === selectedGroup.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {membershipActionGroupId === selectedGroup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        Keluar Grup
                      </button>
                    </div>
                  )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Anggota Aktif
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400">
                      {selectedAcceptedMembers.length} anggota
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedAcceptedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                            {member.user?.profile?.avatar_url ? (
                                                        <AvatarImage
                                src={member.user.profile.avatar_url}
                                alt={`Foto profil ${member.user.name}`}
                                                          size={36}
                                                          className="h-full w-full object-cover"
                                                          fallback={member.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                        />
                                                      ) : (
                              member.user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {member.user?.name || 'Pengguna'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {member.user_id === selectedGroup.creator_id
                                ? 'Creator grup'
                                : member.role === 'admin'
                                  ? 'Admin grup'
                                  : 'Anggota'}
                            </p>
                          </div>
                        </div>

                        {member.role === 'admin' && (
                          <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCanManage && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Permintaan Bergabung
                      </h4>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                        {selectedPendingMembers.length} pending
                      </span>
                    </div>

                    {selectedPendingMembers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                        Tidak ada permintaan bergabung yang menunggu.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPendingMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-bold text-amber-600 shadow-sm">
                                {member.user?.profile?.avatar_url ? (
                                                                <AvatarImage
                                    src={member.user.profile.avatar_url}
                                    alt={`Foto profil ${member.user.name}`}
                                                                  size={36}
                                                                  className="h-full w-full object-cover"
                                                                  fallback={member.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                />
                                                              ) : (
                                  member.user?.name?.charAt(0).toUpperCase() || 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800">
                                  {member.user?.name || 'Pengguna'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-amber-600">
                                  Menunggu persetujuan
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleMemberStatus(
                                    selectedGroup,
                                    member,
                                    'accepted'
                                  )
                                }
                                disabled={memberActionId === member.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-none"
                              >
                                {memberActionId === member.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                Terima
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleMemberStatus(
                                    selectedGroup,
                                    member,
                                    'rejected'
                                  )
                                }
                                disabled={memberActionId === member.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Tolak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
