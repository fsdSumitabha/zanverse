import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { errorCodes, isErrorWithCode, pick } from "@react-native-documents/picker"
import { Picker } from "@react-native-picker/picker"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { launchImageLibrary } from "react-native-image-picker"
import Toast from "react-native-toast-message"

import SpikeSection from "./SpikeSection"
import {
    type CheckResult,
    checkBlobUtil,
    checkDayjs,
    checkKeychain,
    checkMmkv,
    checkNetInfo,
    checkPhoneNumber,
    checkTurboModule,
    createOk,
    createPending,
    getErrorResult,
} from "./spikeChecks"

type CheckKey =
    | "keychain"
    | "mmkv"
    | "netinfo"
    | "datetimepicker"
    | "picker"
    | "imagePicker"
    | "documentsPicker"
    | "blobUtil"
    | "toast"
    | "dayjs"
    | "phone"

const CHECK_LABELS: Record<CheckKey, string> = {
    keychain: "react-native-keychain",
    mmkv: "react-native-mmkv",
    netinfo: "@react-native-community/netinfo",
    datetimepicker: "@react-native-community/datetimepicker",
    picker: "@react-native-picker/picker",
    imagePicker: "react-native-image-picker",
    documentsPicker: "@react-native-documents/picker",
    blobUtil: "react-native-blob-util",
    toast: "react-native-toast-message",
    dayjs: "dayjs",
    phone: "libphonenumber-js",
}

const STATUS_CLASSES: Record<CheckResult["status"], string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    fail: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
}

const STATUS_TEXT: Record<CheckResult["status"], string> = { pending: "TAP", ok: "OK", fail: "FAIL" }

const PICKER_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "Upcoming", value: "upcoming" },
]

const INITIAL_RESULTS: Record<CheckKey, CheckResult> = {
    keychain: createPending("checking…"),
    mmkv: createPending("checking…"),
    netinfo: createPending("checking…"),
    datetimepicker: createPending("tap Open date picker"),
    picker: createOk("2 options · selected: today"),
    imagePicker: createPending("checking…"),
    documentsPicker: createPending("checking…"),
    blobUtil: createPending("checking…"),
    toast: createPending("checking…"),
    dayjs: createPending("checking…"),
    phone: createPending("checking…"),
}

const AUTOMATIC_CHECKS: Array<[CheckKey, () => CheckResult | Promise<CheckResult>]> = [
    ["keychain", checkKeychain],
    ["mmkv", checkMmkv],
    ["netinfo", checkNetInfo],
    ["blobUtil", checkBlobUtil],
    ["imagePicker", () => checkTurboModule("ImagePicker", "tap Open image library")],
    ["documentsPicker", () => checkTurboModule("RNDocumentPicker", "tap Pick a file")],
    ["dayjs", checkDayjs],
    ["phone", checkPhoneNumber],
    ["toast", showSpikeToast],
]

/** Toast has no return value, so reaching the next line without a throw is the proof. */
function showSpikeToast(): CheckResult {
    Toast.show({ type: "success", text1: "Toast works", text2: "react-native-toast-message" })
    return createOk('Toast.show({ type: "success" }) called')
}

/** Runs one check and turns a throw into a FAIL line instead of a red box. */
async function runSafely(check: () => CheckResult | Promise<CheckResult>): Promise<CheckResult> {
    try {
        return await check()
    } catch (error) {
        return getErrorResult(error)
    }
}

/** One line per native module, each reporting OK, FAIL, or TAP (needs a tap to open system UI). */
export default function NativeModuleChecks() {
    const [results, setResults] = useState(INITIAL_RESULTS)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [pickerValue, setPickerValue] = useState(PICKER_OPTIONS[0].value)

    function setResult(key: CheckKey, result: CheckResult) {
        setResults((current) => ({ ...current, [key]: result }))
    }

    useEffect(() => {
        AUTOMATIC_CHECKS.forEach(([key, check]) => {
            runSafely(check).then((result) => setResults((current) => ({ ...current, [key]: result })))
        })
    }, [])

    function handleDateChange(event: DateTimePickerEvent, date?: Date) {
        setIsDatePickerOpen(false)
        const detail =
            event.type === "set" && date
                ? `dialog returned ${dayjs(date).format("DD MMM YYYY")}`
                : `dialog ${event.type}`
        setResult("datetimepicker", createOk(detail))
    }

    function handlePickerChange(value: string) {
        setPickerValue(value)
        setResult("picker", createOk(`2 options · selected: ${value}`))
    }

    async function handleOpenImageLibrary() {
        const result = await runSafely(async () => {
            const response = await launchImageLibrary({ mediaType: "photo", selectionLimit: 1 })
            if (response.errorCode) {
                return getErrorResult(`${response.errorCode}: ${response.errorMessage ?? ""}`)
            }
            return createOk(
                response.didCancel ? "library opened · cancelled" : `picked ${response.assets?.length ?? 0} image`,
            )
        })
        setResult("imagePicker", result)
    }

    async function handlePickFile() {
        try {
            const [file] = await pick()
            setResult("documentsPicker", createOk(`picked ${file.name ?? "a file"}`))
        } catch (error) {
            const isCancelled = isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED
            setResult("documentsPicker", isCancelled ? createOk("picker opened · cancelled") : getErrorResult(error))
        }
    }

    return (
        <SpikeSection title="Native modules">
            {(Object.keys(CHECK_LABELS) as CheckKey[]).map((key) => (
                <View key={key} className="mb-2 flex-row items-start gap-2">
                    <Text
                        className={`w-12 overflow-hidden rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold ${
                            STATUS_CLASSES[results[key].status]
                        }`}
                    >
                        {STATUS_TEXT[results[key].status]}
                    </Text>
                    <View className="flex-1">
                        <Text className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {CHECK_LABELS[key]}
                        </Text>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{results[key].detail}</Text>
                    </View>
                </View>
            ))}

            <Picker selectedValue={pickerValue} onValueChange={handlePickerChange}>
                {PICKER_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
            </Picker>

            <View className="mt-2 flex-row flex-wrap gap-2">
                <SpikeButton label="Open date picker" onPress={() => setIsDatePickerOpen(true)} />
                <SpikeButton label="Open image library" onPress={handleOpenImageLibrary} />
                <SpikeButton label="Pick a file" onPress={handlePickFile} />
                <SpikeButton label="Show toast" onPress={() => setResult("toast", showSpikeToast())} />
            </View>

            {isDatePickerOpen && <DateTimePicker mode="date" value={new Date()} onChange={handleDateChange} />}
        </SpikeSection>
    )
}

interface SpikeButtonProps {
    label: string
    onPress: () => void
}

function SpikeButton({ label, onPress }: SpikeButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            className="min-h-[44px] justify-center rounded-lg bg-neutral-900 px-3 active:opacity-80 dark:bg-white"
        >
            <Text className="text-sm font-medium text-white dark:text-neutral-900">{label}</Text>
        </Pressable>
    )
}
