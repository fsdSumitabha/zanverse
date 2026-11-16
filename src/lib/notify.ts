import Toast from "react-native-toast-message"

// Toasts with sonner's call shape, so the web's 43 toast call sites port as `toast.x(...)` -> `notify.x(...)`.
// react-native-toast-message shows one toast at a time, and a new show replaces the visible one in place.

export type NotifyType = "success" | "error" | "info" | "warning"

export interface NotifyAction {
    label: string
    onClick: () => void
}

export interface NotifyOptions {
    /**
     * A second toast with the same id, while the first is still showing, does not stack. Identical content is ignored
     * and new content updates the toast in place, as sonner does. The web uses "auth-401" and "lead-source-call".
     */
    id?: string
    description?: string
    action?: NotifyAction
    /** Milliseconds on screen. Sonner's default is 4000. */
    duration?: number
}

/** What the toast host's layouts read from `props`. */
export interface NotifyToastProps {
    action?: NotifyAction
}

interface ShownToast {
    id: string | undefined
    content: string
    until: number
    token: number
}

const DEFAULT_DURATION = 4000
// Slide in and slide out take time too. An id counts as showing until a little after its visible time ends.
const ANIMATION_MARGIN = 1000

let shownToast: ShownToast | null = null
let nextToken = 1

function showToast(type: NotifyType, message: string, options: NotifyOptions = {}): void {
    const { id, description, action, duration = DEFAULT_DURATION } = options
    const content = `${type}\n${message}\n${description ?? ""}`
    const now = Date.now()
    const isSameIdShowing = id !== undefined && shownToast?.id === id && now < shownToast.until
    if (isSameIdShowing && shownToast?.content === content) return

    const token = nextToken++
    shownToast = { id, content, until: now + duration + ANIMATION_MARGIN, token }
    Toast.show({
        type,
        text1: message,
        text2: description,
        visibilityTime: duration,
        props: { action } satisfies NotifyToastProps,
        onHide: () => {
            if (shownToast?.token === token) shownToast = null
        },
    })
}

/** Sonner's `toast` for React Native: `notify.error("Session expired", { id: "auth-401" })`. */
export const notify = {
    success(message: string, options?: NotifyOptions): void {
        showToast("success", message, options)
    },
    error(message: string, options?: NotifyOptions): void {
        showToast("error", message, options)
    },
    info(message: string, options?: NotifyOptions): void {
        showToast("info", message, options)
    },
    warning(message: string, options?: NotifyOptions): void {
        showToast("warning", message, options)
    },
    /** Hides the visible toast, like sonner's `toast.dismiss()`. */
    dismiss(): void {
        shownToast = null
        Toast.hide()
    },
}
