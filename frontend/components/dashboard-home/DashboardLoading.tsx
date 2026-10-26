export default function DashboardLoading() {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Memuat Dashboard
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Mengambil data belajar
              terbaru...
            </p>
          </div>
        </div>
      </div>
    );
}
