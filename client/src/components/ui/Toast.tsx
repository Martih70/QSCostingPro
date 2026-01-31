import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({
  id,
  type,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ',
  }[type]

  return (
    <div
      className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300`}
      role="alert"
    >
      <span className="font-bold text-lg">{icon}</span>
      <span className="text-sm">{message}</span>
    </div>
  )
}
