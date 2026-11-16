import type { ReactNode } from "react"
import { View } from "react-native"

import { AccessDenied, OfflineBanner } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"

import { canOpen } from "./permissions"

interface Props {
    routeName: string
    children: ReactNode
}

/**
 * Wraps every screen inside a tab, under its header: the offline bar, then the screen, or AccessDenied when the role
 * may not open it. This replaces the web proxy's page guard.
 */
export default function ScreenLayout({ routeName, children }: Props) {
    const { role } = useAuth()

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <OfflineBanner />
            {canOpen(routeName, role) ? (
                children
            ) : (
                <View className="flex-1 justify-center p-4">
                    <AccessDenied />
                </View>
            )}
        </View>
    )
}

/** For a stack navigator's `screenLayout` prop. */
export function renderScreenLayout({ route, children }: { route: { name: string }; children: ReactNode }) {
    return <ScreenLayout routeName={route.name}>{children}</ScreenLayout>
}
