import "react-native-gesture-handler"

import * as Sentry from "@sentry/react-native"
import { AppRegistry } from "react-native"

import { registerPushBackgroundHandlers } from "@/lib/push/background"
import { initSentry } from "@/lib/sentry"

import App from "./App"
import { name as appName } from "./app.json"

// Before the first render, so a crash while starting up is reported too.
initSentry()

// Outside the React tree: a tap on a reminder, or a push, while the app is in the background or closed.
registerPushBackgroundHandlers()

AppRegistry.registerComponent(appName, () => Sentry.wrap(App))
