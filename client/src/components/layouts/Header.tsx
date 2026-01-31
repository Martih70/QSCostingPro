import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-khc-primary shadow-md sticky top-0 z-30">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Left: Mobile Menu Button + Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-khc-light hover:bg-khc-secondary p-2 rounded-md transition"
            title="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo - Hidden on Desktop (sidebar has it) */}
          <Link to="/dashboard" className="flex md:hidden items-center space-x-2">
            <div className="w-8 h-8 bg-khc-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">QS</span>
            </div>
            <span className="text-white font-bold hidden sm:inline">QSCostingPro</span>
          </Link>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center">
          <div className="hidden sm:block relative group">
            <button className="flex items-center space-x-2 text-khc-light hover:bg-khc-secondary px-3 py-2 rounded-md transition">
              <div className="w-8 h-8 bg-khc-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user && user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <span className="text-sm font-medium">{user?.username}</span>
                <p className="text-xs text-khc-light">
                  {user && user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            </button>
            <div className="absolute right-0 mt-0 w-40 bg-white rounded-md shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <Link
                to="/referrals"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Referrals
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile User Menu */}
          <div className="sm:hidden relative group">
            <button className="text-khc-light hover:bg-khc-secondary p-2 rounded-md transition">
              <div className="w-8 h-8 bg-khc-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user && user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>
            <div className="absolute right-0 mt-0 w-40 bg-white rounded-md shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <Link
                to="/referrals"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Referrals
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
