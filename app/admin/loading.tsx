export default function AdminLoading() {
  return (
    <main className="px-6 py-10 max-w-4xl mx-auto space-y-8">
      <div className="h-7 w-24 bg-gray-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  )
}
