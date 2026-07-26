import Link from "next/link"
import { BoardsPageClient } from "@/components/boards-page-client"

export default function AllBoardsPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">All Boards</h1>
        <Link
          href="/boards/new"
          className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Board
        </Link>
      </div>
      <BoardsPageClient />
    </main>
  )
}
