import Link from "next/link"

export default function AdminPage() {
  return (
    <main className="px-6 py-12 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage employees and configure onboarding phases for your team.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/admin/employees"
          className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">
              &#128100;
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              Employees
            </h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Add, edit, or remove employees. Manage names, titles, start dates,
            managers, territories, and custom fields. Customize which columns
            are visible in the table.
          </p>
          <span className="inline-block mt-4 text-xs font-medium text-blue-600 group-hover:underline">
            Manage employees →
          </span>
        </Link>

        <Link
          href="/admin/phases"
          className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-xl">
              &#9776;
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
              Phases
            </h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Define and edit onboarding phases and their checklist items. Add
            new phases, reorder tasks, update descriptions, and attach
            verification queries for automated checks.
          </p>
          <span className="inline-block mt-4 text-xs font-medium text-purple-600 group-hover:underline">
            Manage phases →
          </span>
        </Link>
      </div>
    </main>
  )
}
