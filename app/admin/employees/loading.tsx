export default function EmployeesLoading() {
  return (
    <main className="px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 px-4 py-3 flex gap-4 border-b border-gray-200">
          {[120, 80, 100, 100, 90].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-300 rounded animate-pulse`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 border-b border-gray-100 last:border-0">
            {[120, 80, 100, 100, 90].map((w, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
