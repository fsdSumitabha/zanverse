import clsx from "clsx"
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"
import ToastMessage, { type ToastConfig, type ToastConfigParams } from "react-native-toast-message"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { enableIconClassNames } from "@/lib/iconClassName"
import type { NotifyToastProps, NotifyType } from "@/lib/notify"

interface ToastTone {
    Icon: LucideIcon
    container: string
    title: string
    description: string
}

// The web mounts sonner with theme="dark" and richColors, so toasts are dark tinted cards in both colour schemes.
const TOAST_TONES: Record<NotifyType, ToastTone> = {
    success: {
        Icon: CircleCheck,
        container: "border-emerald-900 bg-emerald-950",
        title: "text-emerald-300",
        description: "text-emerald-200/80",
    },
    error: {
        Icon: CircleX,
        container: "border-red-900 bg-red-950",
        title: "text-red-300",
        description: "text-red-200/80",
    },
    info: {
        Icon: Info,
        container: "border-blue-900 bg-blue-950",
        title: "text-blue-300",
        description: "text-blue-200/80",
    },
    warning: {
        Icon: TriangleAlert,
        container: "border-yellow-900 bg-yellow-950",
        title: "text-yellow-300",
        description: "text-yellow-200/80",
    },
}

const TOAST_SHADOW = { elevation: 6 }
const TOP_GAP = 8

enableIconClassNames(CircleCheck, CircleX, Info, TriangleAlert)

interface ToastCardProps extends ToastConfigParams<NotifyToastProps> {
    tone: NotifyType
}

function ToastCard({ tone, text1, text2, props, hide }: ToastCardProps) {
    const { Icon, container, title, description } = TOAST_TONES[tone]
    const action = props?.action

    function handleAction() {
        action?.onClick()
        hide()
    }

    return (
        <View
            className={clsx("w-[92%] max-w-md flex-row items-start gap-3 rounded-xl border px-4 py-3", container)}
            style={TOAST_SHADOW}
        >
            <Icon size={18} className={clsx("mt-0.5", title)} />
            <View className="min-w-0 flex-1">
                <Text className={clsx("text-sm font-semibold", title)}>{text1}</Text>
                {!!text2 && <Text className={clsx("mt-0.5 text-sm", description)}>{text2}</Text>}
            </View>
            {action && (
                <Pressable
                    onPress={handleAction}
                    accessibilityRole="button"
                    className="min-h-[36px] justify-center rounded-md bg-white/10 px-3 active:bg-white/20"
                >
                    <Text className={clsx("text-xs font-semibold", title)}>{action.label}</Text>
                </Pressable>
            )}
        </View>
    )
}

function renderToast(tone: NotifyType) {
    return function renderTone(params: ToastConfigParams<NotifyToastProps>) {
        return <ToastCard tone={tone} {...params} />
    }
}

const TOAST_CONFIG: ToastConfig = {
    success: renderToast("success"),
    error: renderToast("error"),
    info: renderToast("info"),
    warning: renderToast("warning"),
}

/** The one toast host, mounted at the app root. Show toasts with `notify` from @/lib/notify. */
export default function ToastHost() {
    const insets = useSafeAreaInsets()
    return <ToastMessage config={TOAST_CONFIG} topOffset={insets.top + TOP_GAP} />
}
