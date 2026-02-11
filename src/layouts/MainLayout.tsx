import { Outlet, Link } from "react-router-dom"

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4">
        <div className="flex gap-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/about" className="hover:underline">About</Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 text-center py-3 text-sm">
        © 2026 My App
      </footer>
    </div>
  )
}

export default MainLayout