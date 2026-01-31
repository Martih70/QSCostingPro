import { ReactNode } from 'react'

interface SidebarSectionProps {
  title: string
  children: ReactNode
}

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
      <h3 className="px-4 mb-3 text-xs font-semibold uppercase text-gray-500">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
