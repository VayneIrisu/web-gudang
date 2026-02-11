import { Routes, Route } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"
import DashboardLayout from "./layouts/DashboardLayout"

import Login from "./pages/Login"
import Home from "./pages/Home"
import About from "./pages/About"
import NotFound from "./pages/NotFound"

import DashboardHome from "./pages/dashboard/DashboardHome"
import InputItemIn from "./pages/dashboard/InputItemIn"
import InputItemOut from "./pages/dashboard/InputItemOut"
import Stok from "./pages/dashboard/Stock"
import KartuGantung from "./pages/dashboard/KartuGantung"
import PergerakanStock from "./pages/dashboard/PergerakanStock"
import PengaturanAkses from "./pages/dashboard/PengaturanAkses"
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Routes>
      {/* Login (DEFAULT) */}
      <Route path="/" element={<Login />} />

      {/* Website */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Dashboard */}
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
        <DashboardLayout />
        </ProtectedRoute>
        }>
        <Route index element={
          <ProtectedRoute>
          <DashboardHome />
          </ProtectedRoute>
          } />
        <Route path="InputItemIn" element={<InputItemIn />} />
        <Route path="InputItemOut" element={<InputItemOut />} />
        <Route path="stok" element={<Stok />} />
        <Route path="kartu-stok" element={<KartuGantung />} />
        <Route path="laporan" element={<PergerakanStock />} />
        <Route path="pengaturan" element={<PengaturanAkses />} />
      </Route>
      <Route path="*" element={<Login />} />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    
  )
}

export default App