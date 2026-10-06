import dayjs from "dayjs"
import { Calendar, Clock, RefreshCw, UserCircle, type LucideIcon } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import type { AuthProfileUser } from "@/types/authProfile"

// dayjs, not toLocaleString with dateStyle: Hermes without full ICU formats that unreliably.
const FACT_DATE_FORMAT = "D MMM YYYY, h:mm A"
const LABEL = "text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"

enableIconClassNames(Calendar, Clock, RefreshCw, UserCircle)

/** "6 Oct 2026, 3:07 PM", or "—" when the API sends nothing. */
export function formatFactDate(iso: string | null): string {
    if (!iso) return "—"
    const date = dayjs(iso)
    return date.isValid() ? date.format(FACT_DATE_FORMAT) : "—"
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <View className="gap-1 border-t border-neutral-100 py-4 dark:border-neutral-800">
            <View className="flex-row items-center gap-1.5">
                <Icon size={14} className="text-neutral-500 dark:text-neutral-400" />
                <Text className={LABEL}>{label}</Text>
            </View>
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</Text>
        </View>
    )
}

/** Member since, last login, last update, and who created the account. Ported from the web's profile `<dl>`. */
export default function ProfileFacts({ profile }: { profile: AuthProfileUser }) {
    return (
        <View>
            <Fact icon={Calendar} label="Member since" value={formatFactDate(profile.createdAt)} />
            <Fact icon={Clock} label="Last login" value={formatFactDate(profile.lastLoginAt)} />
            <Fact icon={RefreshCw} label="Profile last updated" value={formatFactDate(profile.updatedAt)} />
            {profile.createdBy && (
                <View className="gap-1 border-t border-neutral-100 py-4 dark:border-neutral-800">
                    <View className="mb-2 flex-row items-center gap-1.5">
                        <UserCircle size={14} className="text-neutral-500 dark:text-neutral-400" />
                        <Text className={LABEL}>Created by</Text>
                    </View>
                    <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                        {profile.createdBy.name || "—"}
                    </Text>
                    {!!profile.createdBy.email && (
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                            {profile.createdBy.email}
                        </Text>
                    )}
                </View>
            )}
        </View>
    )
}
