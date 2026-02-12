export interface DashboardMenuItem {
  label: string
  path: string
  end?: boolean
}

export const dashboardMenu: DashboardMenuItem[] = [
  { label: "Dashboard", path: "/dashboard", end: true },
  { label: "Input Barang", path: "/dashboard/InputItemIn" },
  { label: "Cek Stok", path: "/dashboard/stok" },
  { label: "Mutasi Barang", path: "/dashboard/kartu-stok" },
]