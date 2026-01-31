import { useState, useCallback, useRef, useEffect } from 'react'
import Toast, { ToastType } from './Toast'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

// Store instance using a ref-based singleton pattern
let toastInstance: ToastContextType | null = null

export const useToast = () => {
  const instance = toastInstance

  return {
    success: (message: string, duration?: number) => {
      if (instance) {
        instance.addToast('success', message, duration)
      }
    },
    error: (message: string, duration?: number) => {
      if (instance) {
        instance.addToast('error', message, duration)
      }
    },
    warning: (message: string, duration?: number) => {
      if (instance) {
        instance.addToast('warning', message, duration)
      }
    },
    info: (message: string, duration?: number) => {
      if (instance) {
        instance.addToast('info', message, duration)
      }
    },
  }
}

interface ToastContainerProps {
  maxToasts?: number
}

export default function ToastContainer({ maxToasts = 3 }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const instanceRef = useRef<ToastContextType | null>(null)

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: ToastMessage = { id, type, message, duration }

      setToasts((prev) => {
        const updated = [...prev, newToast]
        // Keep only the most recent N toasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts)
        }
        return updated
      })
    },
    [maxToasts]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Set up the singleton instance
  useEffect(() => {
    instanceRef.current = { addToast, removeToast }
    toastInstance = instanceRef.current

    return () => {
      if (toastInstance === instanceRef.current) {
        toastInstance = null
      }
    }
  }, [addToast, removeToast])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}
