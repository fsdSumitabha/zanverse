import postcss from "postcss"
import { cssToReactNativeRuntime } from "react-native-css-interop/css-to-rn"
import { injectData } from "react-native-css-interop/dist/runtime/native/styles"
import tailwindcss from "tailwindcss"

import tailwindConfig from "../tailwind.config"

// global.css, the input Metro compiles for the app.
const GLOBAL_CSS = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n"

// The options NativeWind's Metro wrapper passes to the same compiler (nativewind/dist/metro).
const NATIVEWIND_OPTIONS = { inlineRem: 14, ignorePropertyWarningRegex: ["^--tw-"], grouping: ["^group(/.*)?"] }

/**
 * Compiles the app's real stylesheet (tailwind.config.js, its content globs and the NativeWind preset) and registers
 * it with NativeWind's runtime, as Metro does for global.css. Jest never runs Metro, so without this every className
 * resolves to nothing. With it, tests can check the styles a component's classes really produce.
 * jest/setup.js sets NATIVEWIND_OS, which the NativeWind preset reads.
 */
export async function injectAppStylesheet(): Promise<void> {
    // In the app, NativeWind's JSX runtime registers View, Text, Pressable and the other core components on first
    // render. It skips that when NODE_ENV is "test", so tests load the registrations here, as its own test setup does.
    require("react-native-css-interop/dist/runtime/components")
    const result = await postcss([tailwindcss(tailwindConfig)]).process(GLOBAL_CSS, { from: undefined })
    injectData(cssToReactNativeRuntime(result.css, NATIVEWIND_OPTIONS))
}
