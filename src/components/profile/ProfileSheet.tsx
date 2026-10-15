import clsx from "clsx"
import { ChevronRight, Globe, LogOut, Settings, type LucideIcon } from "lucide-react-native"
import { useContext, type ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import RegionSwitcher from "@/components/region/RegionSwitcher"
import { Avatar, Sheet } from "@/components/ui"
import { SheetScrollView } from "@/components/ui/sheetScrollables"
import { USER_ROLE_META } from "@/constants/userRoles"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { BarTabsContext } from "@/navigation/barLayout"
import { openPage, openTab } from "@/navigation/openPage"
import { getSheetSectionsForRole, SHEET_ICONS, type SheetLink } from "@/navigation/sheetItems"

interface Props {
    visible: boolean
    onClose: () => void
}

type RowShape = "only" | "first" | "middle" | "last"

const AVATAR_SIZE = 48
const ICON_SIZE = 22
const CHEVRON_SIZE = 18

// Material 3 Expressive's grouped list: each row its own surface, 2 dp apart, the group's outer corners rounded.
const ROW_SHAPES: Record<RowShape, string> = {
    only: "rounded-3xl",
    first: "rounded-b-md rounded-t-3xl",
    middle: "rounded-md",
    last: "rounded-b-3xl rounded-t-md",
}
const ROW_SURFACE = "bg-neutral-100 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700"

enableIconClassNames(ChevronRight, Globe, LogOut, Settings, ...SHEET_ICONS)

function getRowShape(index: number, count: number): RowShape {
    if (count === 1) return "only"
    if (index === 0) return "first"
    return index === count - 1 ? "last" : "middle"
}

function SectionLabel({ title }: { title: string }) {
    return (
        <Text className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {title}
        </Text>
    )
}

interface RowProps {
    label: string
    icon: LucideIcon
    shape: RowShape
    onPress: () => void
    isDanger?: boolean
}

function SheetRow({ label, icon: Icon, shape, onPress, isDanger = false }: RowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className={clsx("min-h-[56px] flex-row items-center gap-4 px-4", ROW_SURFACE, ROW_SHAPES[shape])}
        >
            <Icon
                size={ICON_SIZE}
                className={isDanger ? "text-red-600 dark:text-red-400" : "text-neutral-700 dark:text-neutral-200"}
            />
            <Text
                className={clsx(
                    "flex-1 text-base",
                    isDanger ? "font-medium text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-neutral-100",
                )}
            >
                {label}
            </Text>
            {!isDanger && <ChevronRight size={CHEVRON_SIZE} className="text-neutral-400 dark:text-neutral-500" />}
        </Pressable>
    )
}

function Group({ children }: { children: ReactNode }) {
    return <View className="gap-0.5">{children}</View>
}

/**
 * The profile sheet (docs/navigation-architecure.md, section 5), opened from the avatar in every top bar: who is
 * signed in and their region, then the tools that have no tab of their own, then App Settings and Log Out. A row the
 * role may not open is left out, as the web's menus do.
 *
 * Its content draws in the SheetProvider, above the tabs, so it reads only the auth and region contexts. The role's
 * bar tabs are read here, where the sheet is written.
 */
export default function ProfileSheet({ visible, onClose }: Props) {
    const { user, role, loading, logout } = useAuth()
    const barTabs = useContext(BarTabsContext)
    const sections = getSheetSectionsForRole(role, barTabs)
    const roleLabel = user ? USER_ROLE_META[user.role]?.label ?? `Role ${user.role}` : ""

    // The sheet closes first, so the page opens on a clear screen.
    function closeThen(action: () => void) {
        onClose()
        action()
    }

    function openLink(link: SheetLink) {
        const { target } = link
        closeThen(() => (target.kind === "tab" ? openTab(target.tab) : openPage(target.page)))
    }

    return (
        <Sheet visible={visible} onClose={onClose} accessibilityLabel="Profile menu">
            <SheetScrollView contentContainerClassName="px-4 pb-4 pt-1">
                <Group>
                    <Pressable
                        onPress={() => closeThen(() => openPage("Profile"))}
                        accessibilityRole="button"
                        accessibilityLabel="My profile"
                        className={clsx("flex-row items-center gap-4 px-4 py-4", ROW_SURFACE, ROW_SHAPES.first)}
                    >
                        <Avatar uri={user?.avatar} size={AVATAR_SIZE} name={user?.name} />
                        <View className="min-w-0 flex-1">
                            <Text
                                numberOfLines={1}
                                className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
                            >
                                {loading ? "Loading..." : user?.name || user?.email || "Unknown"}
                            </Text>
                            <Text numberOfLines={1} className="text-sm text-neutral-600 dark:text-neutral-400">
                                {roleLabel}
                            </Text>
                            {user?.email ? (
                                <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {user.email}
                                </Text>
                            ) : null}
                        </View>
                        <ChevronRight size={CHEVRON_SIZE} className="text-neutral-400 dark:text-neutral-500" />
                    </Pressable>
                    <View
                        className={clsx(
                            "min-h-[56px] flex-row items-center gap-4 bg-neutral-100 px-4 dark:bg-neutral-800",
                            ROW_SHAPES.last,
                        )}
                    >
                        <Globe size={ICON_SIZE} className="text-neutral-700 dark:text-neutral-200" />
                        <Text className="flex-1 text-base text-neutral-900 dark:text-neutral-100">Region</Text>
                        <RegionSwitcher />
                    </View>
                </Group>

                {sections.map((section) => (
                    <View key={section.title}>
                        <SectionLabel title={section.title} />
                        <Group>
                            {section.links.map((link, index) => (
                                <SheetRow
                                    key={link.name}
                                    label={link.name}
                                    icon={link.icon}
                                    shape={getRowShape(index, section.links.length)}
                                    onPress={() => openLink(link)}
                                />
                            ))}
                        </Group>
                    </View>
                ))}

                <SectionLabel title="Preferences" />
                <Group>
                    <SheetRow
                        label="App Settings"
                        icon={Settings}
                        shape="first"
                        onPress={() => closeThen(() => openPage("Settings"))}
                    />
                    <SheetRow label="Log Out" icon={LogOut} shape="last" isDanger onPress={() => closeThen(logout)} />
                </Group>
            </SheetScrollView>
        </Sheet>
    )
}
