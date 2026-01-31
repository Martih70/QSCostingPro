import { useState, ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  children: ReactNode
  defaultOpen?: boolean
  searchQuery?: string
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  searchQuery = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Check if section title matches the search query
  const matches = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase())

  if (searchQuery && !matches) {
    return null
  }

  return (
    <div className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 mb-2 text-xs font-semibold uppercase text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
        {icon && <span>{icon}</span>}
        {title}
      </button>

      {isOpen && (
        <div className="space-y-1 animate-slide-in-top">
          {children}
        </div>
      )}
    </div>
  )
}
