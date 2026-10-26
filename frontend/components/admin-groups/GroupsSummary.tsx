import { Globe2, Lock, UserRound, UsersRound } from 'lucide-react';

export default function GroupsSummary({ summary }: { summary: { total: number; public: number; private: number; pending: number } }) {
  return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Group Ditampilkan
              </p>
  
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>
  
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="h-5 w-5" />
            </div>
          </div>
        </div>
  
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Public
              </p>
  
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {summary.public}
              </p>
            </div>
  
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Globe2 className="h-5 w-5" />
            </div>
          </div>
        </div>
  
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Private
              </p>
  
              <p className="mt-1 text-2xl font-bold text-violet-600">
                {summary.private}
              </p>
            </div>
  
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>
  
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Pending Member
              </p>
  
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {summary.pending}
              </p>
            </div>
  
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <UserRound className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
  );
}
