export default function PhasesLoading() {
  return (
    <main className="px-6 py-10 max-w-4xl mx-auto">
      <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3 bg-gray-50">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
            </div>
            {i < 3 && (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="px-8 py-2.5 flex items-center gap-3">
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
