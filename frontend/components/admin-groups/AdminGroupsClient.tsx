'use client';

import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useAdminGroups } from '@/hooks/admin-groups/useAdminGroups';
import GroupsHeader from '@/components/admin-groups/GroupsHeader';
import GroupsSummary from '@/components/admin-groups/GroupsSummary';
import GroupsFilter from '@/components/admin-groups/GroupsFilter';
import GroupsList from '@/components/admin-groups/GroupsList';
import GroupDetailModal from '@/components/admin-groups/GroupDetailModal';

export default function AdminGroupsClient() {
  const {
    groups,
    loading,
    error,
    setError,
    groupsLoadError,
    search,
    setSearch,
    privacyFilter,
    setPrivacyFilter,
    selectedGroup,
    detailLoading,
    detailError,
    summary,
    handleSearch,
    clearSearch,
    loadGroups,
    loadGroupDetail,
    closeDetail,
  } = useAdminGroups();

  if (!loading && groupsLoadError) {
    return (
      <div
        role="alert"
        className="flex min-h-[420px] items-center justify-center p-6"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Daftar grup belum dapat dimuat
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {groupsLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadGroups()}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <GroupsHeader loading={loading} loadGroups={loadGroups} />

      {/* ERROR */}
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

      {/* SUMMARY */}
      <GroupsSummary summary={summary} />

      {/* FILTER */}
      <GroupsFilter
        search={search}
        setSearch={setSearch}
        privacyFilter={privacyFilter}
        setPrivacyFilter={setPrivacyFilter}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
      />

      {/* GROUP LIST */}
      <GroupsList
        groups={groups}
        loading={loading}
        loadGroupDetail={loadGroupDetail}
      />

      {/* DETAIL MODAL */}
      {(detailLoading ||
        selectedGroup ||
        detailError) && (
        <GroupDetailModal
          selectedGroup={selectedGroup}
          detailLoading={detailLoading}
          detailError={detailError}
          closeDetail={closeDetail}
        />
      )}
    </div>
  );
}
