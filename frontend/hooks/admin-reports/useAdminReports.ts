import { useReportsData } from './useReportsData';
import { useReportModeration } from './useReportModeration';

export function useAdminReports() {
  const data = useReportsData();

  const moderation = useReportModeration({
    handleUnauthorized: data.handleUnauthorized,
    loadReports: data.loadReports,
    setReports: data.setReports,
    setSelectedReport: data.setSelectedReport,
    setError: data.setError,
    setSuccess: data.setSuccess,
  });

  const closeDetail = () => {
    if (
      data.detailLoading ||
      moderation.removeLoading ||
      moderation.restoreLoading ||
      moderation.updateLoading
    ) {
      return;
    }

    data.setSelectedReport(null);
  };

  return { ...data, ...moderation, closeDetail };
}
