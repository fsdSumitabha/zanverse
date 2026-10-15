import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useMemo, type ComponentType, type ReactNode } from "react"

import { useAuth } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { PushProvider } from "@/contexts/PushContext"

import { BarTabsContext, TabNameContext } from "./barLayout"
import FloatingTabBar from "./FloatingTabBar"
import { getBarItemsForRole, getNavItemsForRole, NAV_ITEMS, type NavItem } from "./navItems"
import CallsStack from "./stacks/CallsStack"
import ClientsStack from "./stacks/ClientsStack"
import LeadsStack from "./stacks/LeadsStack"
import MeetingsStack from "./stacks/MeetingsStack"
import ProjectsStack from "./stacks/ProjectsStack"
import UsersStack from "./stacks/UsersStack"
import type { TabName, TabParamList } from "./types"

const Tab = createBottomTabNavigator<TabParamList>()

const TAB_STACKS: Record<TabName, ComponentType> = {
    LeadsTab: LeadsStack,
    ClientsTab: ClientsStack,
    ProjectsTab: ProjectsStack,
    MeetingsTab: MeetingsStack,
    CallsTab: CallsStack,
    UsersTab: UsersStack,
}

// A role with no tab at all, such as the integration user (90), still needs one screen. Leads answers it with the
// API's 403 as Access Denied, and the profile sheet still offers Profile, Settings and Log Out.
const FALLBACK_ITEM = NAV_ITEMS[0]

// The bar's tabs first, so the first one is where the app opens, then the tabs reached from the profile sheet.
function getTabsInOrder(barItems: NavItem[], allowed: NavItem[]): NavItem[] {
    const tabs = [...barItems, ...allowed.filter((item) => !barItems.includes(item))]
    return tabs.length > 0 ? tabs : [FALLBACK_ITEM]
}

// Tells every screen inside a tab which tab it is in, for the top bar and the bottom edge (useTabPlacement).
function renderTabLayout({ route, children }: { route: { name: string }; children: ReactNode }) {
    return <TabNameContext.Provider value={route.name as TabName}>{children}</TabNameContext.Provider>
}

/**
 * The tabs (docs/navigation-architecure.md): every tab the role may open, with the floating bar showing the four main
 * ones. Calls and Users, when outside the bar, open from the profile sheet. Each tab is its own stack, and the stacks
 * draw their own headers. Back moves through the tabs in the order they were visited.
 */
export default function TabNavigator() {
    const { role } = useAuth()
    const barItems = useMemo(() => getBarItemsForRole(role), [role])
    const tabs = useMemo(() => getTabsInOrder(barItems, getNavItemsForRole(role)), [barItems, role])
    const barTabs = useMemo(() => barItems.map((item) => item.tab), [barItems])

    function renderTabBar(props: BottomTabBarProps) {
        return <FloatingTabBar {...props} items={barItems} />
    }

    return (
        <NotificationProvider>
            <PushProvider>
                <BarTabsContext.Provider value={barTabs}>
                    <Tab.Navigator
                        backBehavior="history"
                        tabBar={renderTabBar}
                        screenLayout={renderTabLayout}
                        screenOptions={{ headerShown: false }}
                    >
                        {tabs.map((item) => (
                            <Tab.Screen
                                key={item.tab}
                                name={item.tab}
                                component={TAB_STACKS[item.tab]}
                                // A tab outside the bar has no item to come back to, so it reopens on its list.
                                options={{ title: item.name, popToTopOnBlur: !barTabs.includes(item.tab) }}
                            />
                        ))}
                    </Tab.Navigator>
                </BarTabsContext.Provider>
            </PushProvider>
        </NotificationProvider>
    )
}
