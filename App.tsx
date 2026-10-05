import "./global.css"

import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { ToastHost } from "@/components/ui"
import KitchenSinkScreen from "@/screens/dev/KitchenSinkScreen"
import { ThemedStatusBar } from "@/theme"

// Session 3 shows the kitchen sink directly. Session 5 replaces it with the navigator (NAVIGATION_THEME in
// src/theme.ts is ready for it). The session 1 spike's native module checks are the last kitchen-sink section.
function App() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <ThemedStatusBar />
                <KitchenSinkScreen />
                <ToastHost />
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
