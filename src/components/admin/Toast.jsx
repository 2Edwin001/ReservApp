import { useState, useCallback } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export function Toast({ toast }) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        ok
          ? 'bg-green-500/10 border border-green-500/30 text-green-400'
          : 'bg-red-500/10 border border-red-500/30 text-red-400'
      }`}
    >
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
      {toast.message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }, [])
  return { toast, show }
}
