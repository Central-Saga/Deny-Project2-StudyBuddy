'use client';

import { useMaterialsList } from '@/hooks/materials/useMaterialsList';
import { useMaterialMutations } from '@/hooks/materials/useMaterialMutations';
import { useMaterialReport } from '@/hooks/materials/useMaterialReport';
import DeleteMaterialModal from './DeleteMaterialModal';
import MaterialFormModal from './MaterialFormModal';
import MaterialsHeader from './MaterialsHeader';
import MaterialsList from './MaterialsList';
import MaterialsNotices from './MaterialsNotices';
import MaterialsSearch from './MaterialsSearch';
import MaterialsStats from './MaterialsStats';
import ReportMaterialModal from './ReportMaterialModal';

export default function MaterialsClient() {
  const {
    materials,
    loading,
    hasLoadedMaterials,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    lastPage,
    totalMaterials,
    error,
    setError,
    materialsLoadError,
    success,
    showSuccess,
    fetchMaterials,
    handlePageChange,
  } = useMaterialsList();

  const {
    materialToReport,
    reportReason,
    setReportReason,
    reporting,
    reportError,
    setReportError,
    openReportModal,
    closeReportModal,
    handleReportSubmit,
  } = useMaterialReport({ setError, showSuccess });

  const {
    uploading,
    downloadingId,
    deletingId,
    isModalOpen,
    editingMaterial,
    materialToDelete,
    setMaterialToDelete,
    formData,
    openCreateModal,
    openEditModal,
    closeMaterialModal,
    handleInputChange,
    handleFileChange,
    handleSubmit,
    handleDownload,
    handleDelete,
  } = useMaterialMutations({
    materials,
    currentPage,
    fetchMaterials,
    setError,
    showSuccess,
  });

  return (
    <div className="w-full space-y-6 pb-8">
      <MaterialsHeader openCreateModal={openCreateModal} />

      <MaterialsNotices
        success={success}
        error={error}
        materialsLoadError={materialsLoadError}
        materials={materials}
        currentPage={currentPage}
        fetchMaterials={fetchMaterials}
      />

      <MaterialsStats
        hasLoadedMaterials={hasLoadedMaterials}
        totalMaterials={totalMaterials}
        shownCount={materials.length}
        currentPage={currentPage}
        lastPage={lastPage}
      />

      <MaterialsSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
      />

      <MaterialsList
        materials={materials}
        loading={loading}
        materialsLoadError={materialsLoadError}
        hasLoadedMaterials={hasLoadedMaterials}
        currentPage={currentPage}
        lastPage={lastPage}
        deletingId={deletingId}
        downloadingId={downloadingId}
        reporting={reporting}
        fetchMaterials={fetchMaterials}
        openCreateModal={openCreateModal}
        openEditModal={openEditModal}
        setMaterialToDelete={setMaterialToDelete}
        openReportModal={openReportModal}
        handleDownload={handleDownload}
        handlePageChange={handlePageChange}
      />

      {materialToDelete && (
        <DeleteMaterialModal
          materialToDelete={materialToDelete}
          deletingId={deletingId}
          setMaterialToDelete={setMaterialToDelete}
          handleDelete={handleDelete}
        />
      )}

      {materialToReport && (
        <ReportMaterialModal
          materialToReport={materialToReport}
          reporting={reporting}
          reportReason={reportReason}
          reportError={reportError}
          setReportReason={setReportReason}
          setReportError={setReportError}
          closeReportModal={closeReportModal}
          handleReportSubmit={handleReportSubmit}
        />
      )}

      {isModalOpen && (
        <MaterialFormModal
          editingMaterial={editingMaterial}
          uploading={uploading}
          formData={formData}
          closeMaterialModal={closeMaterialModal}
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
        />
      )}
    </div>
  );
}
