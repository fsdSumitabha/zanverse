import NetInfo from "@react-native-community/netinfo"
import dayjs from "dayjs"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { NativeModules, TurboModuleRegistry } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"
import * as Keychain from "react-native-keychain"
import { createMMKV } from "react-native-mmkv"

export type CheckStatus = "pending" | "ok" | "fail"

export interface CheckResult {
    status: CheckStatus
    detail: string
}

const MMKV_KEY = "spike.roundTrip"
const MMKV_VALUE = "ok"

/** A passed check with what it saw. */
export function createOk(detail: string): CheckResult {
    return { status: "ok", detail }
}

/** A failed check with the reason. */
export function createFail(detail: string): CheckResult {
    return { status: "fail", detail }
}

/** A check that needs a tap before it can report. */
export function createPending(detail: string): CheckResult {
    return { status: "pending", detail }
}

/** Turns any thrown value into a failed check, so one broken module cannot hide the others. */
export function getErrorResult(error: unknown): CheckResult {
    return createFail(error instanceof Error ? error.message : String(error))
}

/**
 * Keychain 10 is a classic bridge module (no TurboModule spec), reached through RN's interop layer.
 * A resolved `null` alone could mean "no biometrics" or "method missing", so check the module first.
 */
export async function checkKeychain(): Promise<CheckResult> {
    if (!NativeModules.RNKeychainManager) {
        return createFail("RNKeychainManager is not linked")
    }

    const biometryType = await Keychain.getSupportedBiometryType()
    return createOk(`linked · biometry: ${biometryType ?? "none"}`)
}

/** MMKV 4 runs on Nitro. A set/getString round trip proves the C++ side is loaded. */
export function checkMmkv(): CheckResult {
    const storage = createMMKV({ id: "spike" })
    storage.set(MMKV_KEY, MMKV_VALUE)
    const value = storage.getString(MMKV_KEY)
    storage.remove(MMKV_KEY)

    if (value !== MMKV_VALUE) {
        return createFail(`read back ${String(value)}`)
    }
    return createOk(`set/getString → "${value}"`)
}

/** NetInfo answers from the native connectivity manager. */
export async function checkNetInfo(): Promise<CheckResult> {
    const state = await NetInfo.fetch()
    return createOk(`isConnected: ${String(state.isConnected)} · ${state.type}`)
}

/** blob-util reads its directory constants from native, then `exists` makes an async native call. */
export async function checkBlobUtil(): Promise<CheckResult> {
    const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir
    const isPresent = await ReactNativeBlobUtil.fs.exists(cacheDir)

    if (!isPresent) {
        return createFail(`cache dir missing: ${cacheDir}`)
    }
    return createOk(`cache dir exists: …${cacheDir.slice(-32)}`)
}

/** Confirms a TurboModule is registered, without opening any system UI. */
export function checkTurboModule(name: string, hint: string): CheckResult {
    if (TurboModuleRegistry.get(name) == null) {
        return createFail(`${name} is not registered`)
    }
    return createPending(`${name} linked · ${hint}`)
}

/** Pure JS, but proves the package resolves in Metro and Hermes. */
export function checkDayjs(): CheckResult {
    return createOk(dayjs().format("DD MMM YYYY"))
}

/** The same call the web's lib/phone.ts makes for an Indian mobile number. */
export function checkPhoneNumber(): CheckResult {
    const phone = parsePhoneNumberFromString("9876543210", "IN")

    if (!phone) {
        return createFail("could not parse 9876543210 for IN")
    }
    return createOk(`${phone.formatInternational()} · valid: ${String(phone.isValid())}`)
}
