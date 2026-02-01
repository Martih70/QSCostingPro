import { useState } from 'react'

interface ProjectNote {
  id: string
  author: string
  content: string
  createdAt: string
}

interface ProjectNotesPanelProps {
  projectId: number
  notes: ProjectNote[]
  onAddNote: (content: string) => Promise<void>
  onDeleteNote?: (noteId: string) => Promise<void>
  isLoading?: boolean
}

export default function ProjectNotesPanel({
  projectId,
  notes,
  onAddNote,
  onDeleteNote,
  isLoading = false,
}: ProjectNotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newNote.trim()) {
      return
    }

    try {
      setIsAdding(true)
      await onAddNote(newNote)
      setNewNote('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Project Notes</h2>
        <p className="text-sm text-gray-600 mt-1">Add comments and notes about this project</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={isAdding || isLoading}
          />
          <button
            type="submit"
            disabled={!newNote.trim() || isAdding || isLoading}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-medium"
          >
            {isAdding ? 'Adding...' : 'Add Note'}
          </button>
        </form>

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">No notes yet. Add one to get started!</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{note.author}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(note.createdAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {onDeleteNote && (
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                      title="Delete note"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
