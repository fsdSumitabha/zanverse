import { Eye, EyeOff } from "lucide-react-native"
import { useRef, useState, type ComponentRef } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { send } from "@/api/client"
import { AUTH_API } from "@/api/endpoints"
import { resetToApp } from "@/api/navigationRef"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import { saveToken } from "@/store/keychain"
import { clearAll, getLastEmail, saveLastEmail } from "@/store/mmkv"
import { PALETTE } from "@/theme"

interface LoginResult {
    id: string
    name?: string
    email?: string
    /** Added by the backend change in docs/BACKEND_CHANGES.md item 3. */
    token?: string
}

// The web's own client-side check, shown inline instead of as a toast.
const MISSING_FIELDS_MESSAGE = "Email and password are required"
// Shown when the API signs the person in but does not return the token. Until docs/BACKEND_CHANGES.md is deployed,
// every login ends here.
const NO_TOKEN_MESSAGE = "The server did not return a sign-in token. The API needs the mobile auth change."
const NOT_SIGNED_IN_MESSAGE = "The server did not accept the sign-in token. The API needs the mobile auth change."

// The web login page's classes. Inputs gain a 44 dp minimum height.
const INPUT_CLASSES =
    "min-h-[44px] w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
const LABEL_CLASSES = "text-xs text-neutral-500"

enableIconClassNames(Eye, EyeOff)

/** Email and password sign-in. Ported from the web's admin login page. */
export default function LoginScreen() {
    const { refreshUser } = useAuth()
    const insets = useSafeAreaInsets()
    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)

    const [email, setEmail] = useState(getLastEmail)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleLogin() {
        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
            setError(MISSING_FIELDS_MESSAGE)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // 1. Sign in. The server's 400, 401 and 403 messages come back as the ApiError's message.
            const data = await send<LoginResult>(AUTH_API.LOGIN, "POST", { email: trimmedEmail, password })
            if (!data?.token) throw new Error(NO_TOKEN_MESSAGE)

            // 2. A new session: drop the last person's region pin and cache, then store the token.
            clearAll()
            await saveToken(data.token)
            saveLastEmail(trimmedEmail)

            // 3. Load the user the same way a restart does.
            const user = await refreshUser()
            if (!user) throw new Error(NOT_SIGNED_IN_MESSAGE)

            notify.success("Login successful")
            resetToApp()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        // Edge-to-edge is on, so Android no longer shrinks the window for the keyboard. Padding works on both.
        <KeyboardAvoidingView className="flex-1 bg-neutral-50 dark:bg-neutral-950" behavior="padding">
            <ScrollView
                contentContainerClassName="flex-grow items-center justify-center px-4"
                contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="w-full max-w-md">
                    <View className="mb-6 items-center">
                        <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Admin Login
                        </Text>
                        <Text className="mt-1 text-sm text-neutral-500">Access your operations dashboard</Text>
                    </View>

                    <View className="rounded-lg border border-neutral-200 bg-white p-5 dark:rounded-xl dark:border-neutral-800 dark:bg-neutral-900">
                        {error && (
                            <View
                                accessibilityLiveRegion="polite"
                                className="mb-4 rounded-lg border border-red-500/30 bg-red-50 p-3 dark:bg-red-900/10"
                            >
                                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    Login failed
                                </Text>
                                <Text className="mt-1 text-xs text-neutral-500">{error}</Text>
                            </View>
                        )}

                        <View className="gap-4">
                            <View>
                                <Text className={LABEL_CLASSES}>Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@company.com"
                                    placeholderTextColor={PALETTE["neutral-400"]}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                    returnKeyType="next"
                                    submitBehavior="submit"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    accessibilityLabel="Email"
                                    className={`mt-1 ${INPUT_CLASSES}`}
                                />
                            </View>

                            <View>
                                <Text className={LABEL_CLASSES}>Password</Text>
                                <View className="mt-1 justify-center">
                                    <TextInput
                                        ref={passwordRef}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Enter password"
                                        placeholderTextColor={PALETTE["neutral-400"]}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="password"
                                        textContentType="password"
                                        returnKeyType="go"
                                        onSubmitEditing={handleLogin}
                                        accessibilityLabel="Password"
                                        className={`pr-12 ${INPUT_CLASSES}`}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        accessibilityRole="button"
                                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                        hitSlop={4}
                                        className="absolute right-0 h-11 w-11 items-center justify-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} className="text-neutral-500" />
                                        ) : (
                                            <Eye size={16} className="text-neutral-500" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                onPress={handleLogin}
                                disabled={loading}
                                accessibilityRole="button"
                                accessibilityState={{ disabled: loading, busy: loading }}
                                className="min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-md bg-neutral-800 py-2 active:opacity-80 disabled:opacity-60"
                            >
                                {loading && <ActivityIndicator size="small" color={PALETTE.white} />}
                                <Text className="text-sm text-white">{loading ? "Signing in..." : "Sign In"}</Text>
                            </Pressable>
                        </View>

                        <View className="mt-4 items-center">
                            <Text className="text-center text-xs text-neutral-500">
                                Only authorized users can access this panel
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
