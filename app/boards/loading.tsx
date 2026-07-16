export default function BoardsLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  )
}
