import { create } from 'zustand'

let _seq = 0

export const useToastStore = create((set) => ({
  toasts: [],

  _add(toast) {
    const id = ++_seq
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    const ms = toast.duration ?? 3500
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), ms)
    return id
  },

  dismiss(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

/** Imperative toast API — import and call anywhere */
export const toast = {
  success: (message, opts) => useToastStore.getState()._add({ message, type: 'success', ...opts }),
  error:   (message, opts) => useToastStore.getState()._add({ message, type: 'error',   ...opts }),
  info:    (message, opts) => useToastStore.getState()._add({ message, type: 'info',    ...opts }),
  warn:    (message, opts) => useToastStore.getState()._add({ message, type: 'warn',    ...opts }),
}
