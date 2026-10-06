import "react-native-gesture-handler"

import * as Sentry from "@sentry/react-native"
import { AppRegistry } from "react-native"

import { initSentry } from "@/lib/sentry"

import App from "./App"
import { name as appName } from "./app.json"

// Before the first render, so a crash while starting up is reported too.
initSentry()

AppRegistry.registerComponent(appName, () => Sentry.wrap(App))
