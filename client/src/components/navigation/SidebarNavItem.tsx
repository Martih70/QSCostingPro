import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface SidebarNavItemProps {
  to: string
  icon: string
  label: string
  requiredRoles?: string | string[]
}

export default function SidebarNavItem({
  to,
  icon,
  label,
  requiredRoles,
}: SidebarNavItemProps) {
  const { hasPermission } = useAuth()

  // Check role-based visibility
  if (requiredRoles && !hasPermission(requiredRoles)) {
    return null
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
          isActive
            ? 'bg-khc-light border-l-4 border-khc-primary text-khc-primary font-medium scale-[1.02]'
            : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.01]'
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}
