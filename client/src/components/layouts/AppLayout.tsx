import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from '../navigation/Sidebar'
import ToastContainer from '../ui/ToastContainer'

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-khc-light flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[80%] bg-white shadow-xl">
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-khc-neutral text-khc-light py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm">
                  &copy; 2026 QSCostingPro. Professional Cost Estimation for Quantity Surveyors.
                </p>
              </div>
              <div className="text-sm">
                <p>Version 1.0.0</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
