export default function BoardLoading() {
  return (
    <main className="px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="shrink-0 w-72 space-y-3">
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: col === 0 ? 4 : col === 1 ? 3 : 2 }).map((_, card) => (
              <div key={card} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse mt-2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
