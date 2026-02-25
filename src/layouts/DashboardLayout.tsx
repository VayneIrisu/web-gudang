import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { useState } from "react"
import { dashboardMenu } from "../constants/dashboardMenu"

function DashboardLayout() {

  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const navigate = useNavigate();

  // Ambil user dari localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 inset-y-0 left-0 bg-slate-900 text-slate-100 shadow-xl
          transform transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:translate-x-0 md:static md:z-auto
          ${desktopOpen ? "md:w-64" : "md:w-0 md:overflow-hidden"}
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
          <div className="font-bold text-xl tracking-wide flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              G
            </div>
            <span>GUDANG</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          {dashboardMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {/* Icon Placeholder (Optional: Add icons to dashboardMenu.ts later) */}
              <span className={`w-2 h-2 rounded-full ${item.end ? 'bg-current' : 'border border-current'}`}></span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
            &copy; 2026 Sistem Gudang
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => mobileOpen ? setMobileOpen(false) : setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>

            <button
              onClick={() => setDesktopOpen(!desktopOpen)}
              className="hidden md:block p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>

            <h1 className="font-semibold text-lg text-slate-800 hidden sm:block">
              Dashboard Overview
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">{userName}</div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                {userName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-x-hidden overflow-y-auto w-full max-w-7xl mx-auto">
          <Outlet context={{ desktopOpen }} />
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout