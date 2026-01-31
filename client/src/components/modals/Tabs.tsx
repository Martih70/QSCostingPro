interface Tab {
  id: string
  label: string
  icon?: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-khc-primary text-khc-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
