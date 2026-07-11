import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Boxes,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  PackageSearch,
  Upload,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/reorders', label: 'Reorder Hub', icon: PackageSearch },
  { to: '/forecast', label: 'Demand Forecast', icon: LineChart },
  { to: '/vendors', label: 'Vendor Scores', icon: Boxes },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/data', label: 'Data Upload', icon: Upload },
]

export function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] gap-5 p-4 md:p-6">
      <aside className="sidebar-glow hidden w-[268px] shrink-0 flex-col rounded-[28px] px-5 py-6 text-white shadow-2xl shadow-black/20 lg:flex">
        <div className="mb-10 px-2">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-bright/30 to-white/5 ring-1 ring-white/20">
            <Activity className="h-5 w-5 text-teal-bright" />
          </div>
          <p className="font-display text-[1.4rem] font-700 tracking-tight">ProcureAI</p>
          <p className="mt-1 text-sm leading-snug text-white/50">Purchase & Supplier Intelligence</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/15'
                    : 'text-white/55 hover:bg-white/6 hover:text-white',
                ].join(' ')
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition group-hover:bg-white/10">
                <Icon className="h-[16px] w-[16px] opacity-90" />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Local engine</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Data stays in Chrome IndexedDB. Forecast, TOPSIS, and Isolation Forest run in-browser.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Procurement command center
            </p>
            <h1 className="font-display text-2xl font-700 tracking-tight text-ink md:text-[1.7rem]">
              Optimize buying with clarity
            </h1>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-muted sm:flex">
              <span className="h-2 w-2 animate-[pulse-soft_2s_ease-in-out_infinite] rounded-full bg-teal" />
              Live analysis
            </div>

            <button
              type="button"
              className="theme-toggle"
              data-active={theme}
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <Lightbulb
                className="h-[18px] w-[18px]"
                fill={theme === 'dark' ? 'currentColor' : 'none'}
                strokeWidth={theme === 'dark' ? 1.5 : 2}
              />
            </button>

            <div className="rounded-xl bg-contrast px-4 py-2.5 text-sm font-semibold text-on-contrast shadow-sm">
              {today}
            </div>
          </div>
        </header>

        <div className="glass-panel flex gap-2 overflow-x-auto rounded-2xl p-2 lg:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition',
                  isActive ? 'bg-contrast text-on-contrast' : 'text-muted hover:bg-paper-soft',
                ].join(' ')
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </div>

        <main className="min-h-0 flex-1 pb-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
