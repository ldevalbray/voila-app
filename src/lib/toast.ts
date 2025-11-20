import toast from 'react-hot-toast'

/**
 * Utilitaires pour afficher des toasts
 * Encapsule react-hot-toast avec des styles cohérents
 */

export const showToast = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (message: string) => {
    toast.error(message)
  },
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    })
  },
  loading: (message: string) => {
    return toast.loading(message)
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        duration: 4000,
      }
    )
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId)
  },
}

