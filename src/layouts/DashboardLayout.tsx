import { Outlet, NavLink } from "react-router-dom"
import { useState } from "react"
import { dashboardMenu } from "../constants/dashboardMenu"

function DashboardLayout() {

  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 inset-y-0 left-0 bg-slate-800 text-white
          transform transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:translate-x-0 md:static md:z-auto
          ${desktopOpen ? "md:w-64" : "md:w-0 md:overflow-hidden"}
        `}
      >
        <div className="p-4 font-bold text-lg whitespace-nowrap overflow-hidden">
          Gudang Admin
        </div>

        <nav className="px-4 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-64px)]">
          {dashboardMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded whitespace-nowrap overflow-hidden ${isActive ? "bg-slate-700" : "hover:bg-slate-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white shadow px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-xl p-1 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>

          {/* Desktop Toggle */}
          <button
            onClick={() => setDesktopOpen(!desktopOpen)}
            className="hidden md:block text-xl p-1 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>

          <h1 className="font-semibold text-lg">INVENTORY</h1>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 flex-1 overflow-x-hidden">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout