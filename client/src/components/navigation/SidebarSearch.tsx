import { useState } from 'react'

interface SidebarSearchProps {
  onSearch: (query: string) => void
}

export default function SidebarSearch({ onSearch }: SidebarSearchProps) {
  const [query, setQuery] = useState('')

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <input
        type="text"
        placeholder="Search pages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onSearch(e.target.value)
        }}
        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
      />
    </div>
  )
}
