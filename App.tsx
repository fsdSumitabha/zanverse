import "./global.css"

import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { ToastHost } from "@/components/ui"
import { AuthProvider } from "@/contexts/AuthContext"
import { RegionProvider } from "@/contexts/RegionContext"
import { StatusProvider } from "@/contexts/StatusContext"
import RootNavigator from "@/navigation/RootNavigator"
import { ThemedStatusBar } from "@/theme"

// The providers sit above the navigation container, so a region switch can remount the screens without losing the
// session. The toast host sits above it too, so a toast outlives the screen that showed it.
function App() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <AuthProvider>
                    <RegionProvider>
                        <StatusProvider>
                            <ThemedStatusBar />
                            <RootNavigator />
                            <ToastHost />
                        </StatusProvider>
                    </RegionProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    )
}

// GestureHandlerRootView is not a core component, so NativeWind does not map className on it.
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
})

export default App
