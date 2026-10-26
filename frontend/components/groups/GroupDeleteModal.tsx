import {
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  ModalOverlay,
} from './parts';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'showDeleteModal'
  | 'setShowDeleteModal'
  | 'groupToDelete'
  | 'setGroupToDelete'
  | 'deleting'
  | 'handleDeleteGroup'
>;

export default function GroupDeleteModal({
  showDeleteModal,
  setShowDeleteModal,
  groupToDelete,
  setGroupToDelete,
  deleting,
  handleDeleteGroup,
}: Props) {
  return (
    <>
      {showDeleteModal && groupToDelete && (
        <ModalOverlay>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Hapus Grup?
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Grup <span className="font-bold text-slate-700">{groupToDelete.name}</span>{' '}
              akan dihapus permanen. Membership dan sesi belajar yang terkait
              dengan grup ini juga akan terhapus.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setGroupToDelete(null);
                }}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
