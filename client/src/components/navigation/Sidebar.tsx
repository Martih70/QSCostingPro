import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import SidebarNavItem from './SidebarNavItem'
import CollapsibleSection from './CollapsibleSection'
import SidebarSearch from './SidebarSearch'

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    onClose?.()
  }

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-khc-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
          QS
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900">QSCostingPro</h1>
          <p className="text-xs text-gray-500">v1.0</p>
        </div>
      </div>

      {/* Search */}
      <SidebarSearch onSearch={setSearchQuery} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Main Section */}
        <div onClick={handleNavClick} className="space-y-1">
          <SidebarNavItem to="/dashboard" icon="🏠" label="Home" />
        </div>

        {/* Projects Section */}
        <CollapsibleSection title="Projects" icon="📋" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem to="/projects" icon="📋" label="All Projects" />
            <SidebarNavItem to="/projects/new" icon="➕" label="New" />
            <SidebarNavItem to="/projects?status=current" icon="⏳" label="Current" />
            <SidebarNavItem to="/projects?status=completed" icon="✅" label="Completed" />
          </div>
        </CollapsibleSection>

        {/* Estimate Builder Section */}
        <CollapsibleSection title="Estimate Builder" icon="📊" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem
              to="/projects"
              icon="📊"
              label="Build Estimate"
              requiredRoles={['admin', 'estimator']}
            />
            <SidebarNavItem
              to="/internal-rates"
              icon="⚙️"
              label="Build Rates"
              requiredRoles={['admin', 'estimator']}
            />
          </div>
        </CollapsibleSection>

        {/* Contacts Section */}
        <CollapsibleSection title="Contacts" icon="👥" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem to="/clients" icon="👥" label="Clients" />
            <SidebarNavItem to="/contractors" icon="🔧" label="Contractors" />
          </div>
        </CollapsibleSection>

        {/* Reference Library Section */}
        <CollapsibleSection title="Reference Library" icon="📚" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem
              to="/nrm2"
              icon="📖"
              label="NRM 2 Codes"
            />
            <SidebarNavItem
              to="/references/documents"
              icon="📄"
              label="Documents"
            />
          </div>
        </CollapsibleSection>

        {/* Admin Section */}
        <CollapsibleSection title="Admin" icon="⚙️" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem
              to="/cost-items"
              icon="💾"
              label="Cost Database"
              requiredRoles="admin"
            />
            <SidebarNavItem
              to="/users"
              icon="👤"
              label="User Management"
              requiredRoles="admin"
            />
            <SidebarNavItem
              to="/personal-database"
              icon="📁"
              label="Cost Uploader"
              requiredRoles="admin"
            />
          </div>
        </CollapsibleSection>

        {/* Account Section */}
        <CollapsibleSection title="Account" icon="👤" searchQuery={searchQuery}>
          <div onClick={handleNavClick} className="space-y-1">
            <SidebarNavItem to="/referrals" icon="🎁" label="Referrals" />
          </div>
        </CollapsibleSection>
      </nav>

      {/* User Info Footer */}
      {user && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-khc-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
