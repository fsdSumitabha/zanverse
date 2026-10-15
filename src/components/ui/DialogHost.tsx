import { createContext, Fragment, useContext, useMemo, useState, type ReactNode } from "react"

interface DialogLayer {
    /** Draws a dialog on the layer, or redraws it with new content. */
    show: (key: string, dialog: ReactNode) => void
    hide: (key: string) => void
}

const DialogLayerContext = createContext<DialogLayer | null>(null)

/**
 * The layer every Dialog draws on. A Dialog is written inside its screen, often inside a scroll view, but drawn here,
 * so it covers the whole window: the screen, its header and the tab bar. SheetProvider mounts it under its sheets, so
 * a picker opened from a dialog draws over the dialog.
 */
export default function DialogHost({ children }: { children: ReactNode }) {
    const [dialogs, setDialogs] = useState<ReadonlyMap<string, ReactNode>>(() => new Map())

    const layer = useMemo<DialogLayer>(
        () => ({
            show: (key, dialog) => setDialogs((current) => new Map(current).set(key, dialog)),
            hide: (key) =>
                setDialogs((current) => {
                    if (!current.has(key)) return current
                    const next = new Map(current)
                    next.delete(key)
                    return next
                }),
        }),
        [],
    )

    return (
        <DialogLayerContext.Provider value={layer}>
            {children}
            {Array.from(dialogs, ([key, dialog]) => (
                <Fragment key={key}>{dialog}</Fragment>
            ))}
        </DialogLayerContext.Provider>
    )
}

/** The dialog layer, or null outside a DialogHost, where a Dialog draws in place. */
export function useDialogLayer(): DialogLayer | null {
    return useContext(DialogLayerContext)
}
