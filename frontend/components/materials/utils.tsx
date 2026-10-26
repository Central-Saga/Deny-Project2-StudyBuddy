import { FileArchive, FileText, Image as ImageIcon } from 'lucide-react';

export const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

export const getFileTypeLabel = (type: string) => {
  if (!type) return 'FILE';
  return type.toUpperCase();
};

export const getFileTypeStyle = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'pdf':
      return 'bg-red-50 text-red-700 border-red-100';

    case 'doc':
    case 'docx':
      return 'bg-blue-50 text-blue-700 border-blue-100';

    case 'ppt':
    case 'pptx':
      return 'bg-amber-50 text-amber-700 border-amber-100';

    case 'zip':
    case 'rar':
      return 'bg-violet-50 text-violet-700 border-violet-100';

    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';

    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export const getFileIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'ppt':
    case 'pptx':
      return <FileText className="h-5 w-5" />;

    case 'zip':
    case 'rar':
      return <FileArchive className="h-5 w-5" />;

    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImageIcon className="h-5 w-5" />;

    default:
      return <FileText className="h-5 w-5" />;
  }
};
