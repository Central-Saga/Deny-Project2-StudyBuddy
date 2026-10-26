'use client';

import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/admin-users/useAdminUsers';
import { UsersSummary } from './UsersSummary';
import UsersFilter from './UsersFilter';
import UsersTable from './UsersTable';
import StatusConfirmModal from './StatusConfirmModal';

export default function AdminUsersClient() {
  const {
    users,
    loading,
    statusLoading,
    error,
    setError,
    usersLoadError,
    success,
    setSuccess,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusTarget,
    setStatusTarget,
    loadUsers,
    summary,
    handleSearch,
    clearSearch,
    changeStatus,
  } = useAdminUsers();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Administrasi
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Manage Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Lihat dan kelola status akun
            pengguna Study Buddy.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadUsers()
          }
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ALERT */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            {success}
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess('')
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <UsersSummary
        loading={loading}
        usersLoadError={usersLoadError}
        summary={summary}
      />

      <UsersFilter
        search={search}
        setSearch={setSearch}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <UsersTable
        loading={loading}
        usersLoadError={usersLoadError}
        users={users}
        loadUsers={loadUsers}
        setStatusTarget={setStatusTarget}
      />

      {statusTarget && (
        <StatusConfirmModal
          statusTarget={statusTarget}
          statusLoading={statusLoading}
          setStatusTarget={setStatusTarget}
          changeStatus={changeStatus}
        />
      )}
    </div>
  );
}
