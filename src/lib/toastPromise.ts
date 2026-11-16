import { notify } from "./notify"

interface ToastPromiseMessages<T> {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
}

// Long enough to outlast any request. The success or error toast replaces it.
const LOADING_DURATION = 60_000
let nextId = 1

/**
 * Sonner's `toast.promise` over the app's toasts: one toast that reads `loading` while the promise runs, then turns
 * into the success or error text in place. Returns the same promise, so the caller can still await it.
 */
export function toastPromise<T>(promise: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T> {
    const id = `toast-promise-${nextId++}`
    notify.info(messages.loading, { id, duration: LOADING_DURATION })

    promise.then(
        (data) => {
            const text = typeof messages.success === "function" ? messages.success(data) : messages.success
            notify.success(text, { id })
        },
        (error: unknown) => {
            const text = typeof messages.error === "function" ? messages.error(error) : messages.error
            notify.error(text, { id })
        },
    )

    return promise
}
