import Link from "next/link"

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/icon.svg" width="28" height="28" alt="" className="rounded-lg" />
              <span className="text-sm font-semibold text-indigo-200 tracking-wide uppercase">RevOps Process Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white mb-3">
              Turn any process doc into a<br className="hidden sm:block" /> live, trackable program.
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed">
              Import your documentation, and AI builds the phases, tasks, and checklists.
              Every person on every board gets tracked from day one.
            </p>
          </div>

          {/* Feature columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            <div className="rounded-2xl bg-white/8 border border-white/15 px-5 py-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div className="text-sm font-semibold text-white mb-1">AI extracts phases from any doc</div>
              <p className="text-xs text-indigo-300 leading-relaxed">
                Drop a PDF, Word doc, or spreadsheet and AI pulls out phases, tasks, and employees automatically. No manual setup.
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 border border-white/15 px-5 py-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/30 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="text-sm font-semibold text-white mb-1">Live progress per person</div>
              <p className="text-xs text-indigo-300 leading-relaxed">
                Every checklist update reflects instantly across board, kanban, and dashboard views. See who's on track and who needs attention.
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 border border-white/15 px-5 py-5">
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/30 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="text-sm font-semibold text-white mb-1">Snowflake-verified milestones</div>
              <p className="text-xs text-indigo-300 leading-relaxed">
                Tasks can be backed by live SQL checks against your Snowflake data, so completion is confirmed by data, not just a checkbox.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8 text-center">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
            {[
              {
                n: "1", color: "bg-indigo-600", title: "Name your board",
                desc: "Give the program a name — a cohort, a team, a process. This becomes the home for everyone going through it.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>,
              },
              {
                n: "2", color: "bg-violet-600", title: "Import or build phases",
                desc: "Drop a process doc and AI extracts phases and tasks automatically. Or build the workflow yourself step by step.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
              },
              {
                n: "3", color: "bg-purple-600", title: "Add people",
                desc: "Import employees from a list or add them one by one. Each person gets their own checklist tied to every phase.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              },
              {
                n: "4", color: "bg-fuchsia-600", title: "Track & verify",
                desc: "Watch every person move through phases in real time. Run Snowflake-backed checks to verify milestones are truly complete.",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>,
              },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 relative">
                {i < arr.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-1/2 w-full h-px border-t-2 border-dashed border-gray-200" style={{ left: "50%", width: "100%" }} />
                )}
                <div className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-3 z-10 sm:px-4 pb-8 sm:pb-0">
                  <div className={`shrink-0 w-12 h-12 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-md`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:justify-center mb-0.5">
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Step {step.n}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/boards"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow"
            >
              Go to your boards →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// Keep Employee type exported for other pages that import it
export interface Employee {
  ID: string
  FULL_NAME: string
  TITLE: string
  START_DATE: string
  MANAGER: string
  TERRITORY: string
  NOTES: string
  EMAIL: string | null
  checklist: Record<string, Record<string, boolean>>
  checkedCount: number
  currentPhase: string
}
