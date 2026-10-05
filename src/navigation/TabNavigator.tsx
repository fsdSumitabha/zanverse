import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ellipsis, type LucideIcon } from "lucide-react-native"
import type { ComponentType, ReactNode } from "react"

import { useAuth } from "@/contexts/AuthContext"

import { getNavItemsForRole, type NavItem } from "./navItems"
import CallsStack from "./stacks/CallsStack"
import ClientsStack from "./stacks/ClientsStack"
import DashboardStack from "./stacks/DashboardStack"
import LeadsStack from "./stacks/LeadsStack"
import MoreStack from "./stacks/MoreStack"
import ProjectsStack from "./stacks/ProjectsStack"
import UsersStack from "./stacks/UsersStack"
import type { TabParamList } from "./types"

const Tab = createBottomTabNavigator<TabParamList>()

const TAB_STACKS: Record<NavItem["tab"], ComponentType> = {
    DashboardTab: DashboardStack,
    LeadsTab: LeadsStack,
    CallsTab: CallsStack,
    ClientsTab: ClientsStack,
    ProjectsTab: ProjectsStack,
    UsersTab: UsersStack,
}

const TAB_ICON_SIZE = 22
// Seven tabs fit a 360 dp phone only with a small label. "Dashboard" is the longest.
const TAB_LABEL_STYLE = { fontSize: 10 }

type TabIcon = (props: { color: string }) => ReactNode

// Built once per icon, so the tab bar gets the same function on every render.
const TAB_ICONS = new Map<LucideIcon, TabIcon>()

function getTabIcon(Icon: LucideIcon): TabIcon {
    const existing = TAB_ICONS.get(Icon)
    if (existing) return existing
    const created: TabIcon = ({ color }) => <Icon size={TAB_ICON_SIZE} color={color} />
    TAB_ICONS.set(Icon, created)
    return created
}

/**
 * The bottom tabs: the web's MobileNav items the signed-in role may see, then More. Each tab is its own stack, and the
 * stacks draw their own headers.
 */
export default function TabNavigator() {
    const { role } = useAuth()
    const items = getNavItemsForRole(role)

    return (
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarLabelStyle: TAB_LABEL_STYLE }}>
            {items.map((item) => (
                <Tab.Screen
                    key={item.tab}
                    name={item.tab}
                    component={TAB_STACKS[item.tab]}
                    options={{ title: item.name, tabBarIcon: getTabIcon(item.icon) }}
                />
            ))}
            <Tab.Screen
                name="MoreTab"
                component={MoreStack}
                options={{ title: "More", tabBarIcon: getTabIcon(Ellipsis) }}
            />
        </Tab.Navigator>
    )
}
