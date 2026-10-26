import {
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { GroupsPageState } from '@/hooks/groups/useGroupsPage';

type Props = Pick<
  GroupsPageState,
  'hasLoadedGroups'
  | 'errorMsg'
  | 'setErrorMsg'
  | 'successMsg'
>;

export default function GroupsNotices({
  hasLoadedGroups,
  errorMsg,
  setErrorMsg,
  successMsg,
}: Props) {
  return (
    <>
      {errorMsg && hasLoadedGroups && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Terjadi kesalahan</p>
              <p className="mt-0.5 text-xs text-red-600">
                {errorMsg}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMsg}
        </div>
      )}
    </>
  );
}
