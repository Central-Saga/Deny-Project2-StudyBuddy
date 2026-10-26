import type { UserDto } from '@/types/api';
import type { StatusTarget } from './types';
import { formatDate, getInitials } from './utils';
import {
  Mail,
  RefreshCw,
  UserCheck,
  Users,
  UserX,
  AlertTriangle,
} from 'lucide-react';

interface UsersTableProps {
  loading: boolean;
  usersLoadError: string;
  users: UserDto[];
  loadUsers: () => Promise<void>;
  setStatusTarget: (target: StatusTarget | null) => void;
}

export default function UsersTable({
  loading,
  usersLoadError,
  users,
  loadUsers,
  setStatusTarget,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">
          Daftar User
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Administrator tidak ditampilkan
          pada daftar user biasa.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : usersLoadError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center px-6 py-16 text-center"
        >
          <AlertTriangle className="h-10 w-10 text-red-500" />

          <h3 className="mt-4 text-base font-bold text-slate-800">
            Daftar pengguna belum dapat dimuat
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            {usersLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-800">
            User tidak ditemukan
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Belum ada user yang sesuai
            dengan filter atau kata
            pencarian.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  User
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detail
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bergabung
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                          {getInitials(
                            user.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-bold text-slate-800">
                            {
                              user.name
                            }
                          </p>

                          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail className="h-3 w-3" />

                            <span className="max-w-[220px] truncate">
                              {
                                user.email
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-700">
                        {user.profile
                          ?.university ||
                          '-'}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {user.profile
                          ?.major ||
                          user.course ||
                          'Belum ada jurusan'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(
                        user.created_at
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {user.account_status ===
                      'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {user.account_status ===
                      'active' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusTarget(
                              {
                                user,
                                nextStatus:
                                  'suspended',
                              }
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <UserX className="h-3.5 w-3.5" />

                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusTarget(
                              {
                                user,
                                nextStatus:
                                  'active',
                              }
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" />

                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
