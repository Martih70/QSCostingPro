import { Link } from 'react-router-dom'
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed'

export default function RecentProjectsWidget() {
  const { getRecent, clearRecent } = useRecentlyViewed()
  const recent = getRecent()

  if (recent.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-khc-primary">Recently Viewed</h3>
        <button
          onClick={clearRecent}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {recent.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="block px-4 py-2 rounded bg-gray-50 hover:bg-khc-light text-gray-900 hover:text-khc-primary transition-colors text-sm"
          >
            <div className="font-medium truncate">{project.name}</div>
            <div className="text-xs text-gray-500">
              {new Date(project.viewed_at).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
