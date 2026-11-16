import Toast from "react-native-toast-message"

import { notify } from "@/lib/notify"

jest.mock("react-native-toast-message", () => ({
    __esModule: true,
    default: { show: jest.fn(), hide: jest.fn() },
}))

const show = jest.mocked(Toast.show)

/** The onHide callback the last shown toast was given, as the toast host would call it. */
function hideLastToast() {
    show.mock.calls.at(-1)?.[0].onHide?.()
}

beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 0) })
    notify.dismiss()
    jest.clearAllMocks()
})

afterEach(() => {
    jest.useRealTimers()
})

describe("dedupe by id", () => {
    test("the same id fired three times in a row shows one toast", () => {
        notify.error("Session expired. Please log in again.", { id: "auth-401" })
        notify.error("Session expired. Please log in again.", { id: "auth-401" })
        notify.error("Session expired. Please log in again.", { id: "auth-401" })
        expect(show).toHaveBeenCalledTimes(1)
    })

    test("new content under the same id updates the visible toast in place, as sonner does", () => {
        notify.info("Call Asha Rao", { id: "lead-source-call" })
        notify.info("Call Ravi Kumar", { id: "lead-source-call" })
        expect(show).toHaveBeenCalledTimes(2)
        expect(show.mock.calls[1][0]).toMatchObject({ text1: "Call Ravi Kumar" })
    })

    test("the id can show again once its toast has hidden", () => {
        notify.error("Session expired", { id: "auth-401" })
        hideLastToast()
        notify.error("Session expired", { id: "auth-401" })
        expect(show).toHaveBeenCalledTimes(2)
    })

    test("the id can show again after its time is up, even if the host never reported the hide", () => {
        notify.error("Session expired", { id: "auth-401", duration: 4000 })
        jest.advanceTimersByTime(4000 + 1000 + 1)
        notify.error("Session expired", { id: "auth-401", duration: 4000 })
        expect(show).toHaveBeenCalledTimes(2)
    })

    test("a later toast's hide does not clear a newer toast with the same id", () => {
        notify.error("First", { id: "auth-401" })
        const firstOnHide = show.mock.calls[0][0].onHide
        notify.error("Second", { id: "auth-401" })
        firstOnHide?.()
        notify.error("Second", { id: "auth-401" })
        expect(show).toHaveBeenCalledTimes(2)
    })

    test("toasts without an id, or with different ids, always show", () => {
        notify.success("Lead created")
        notify.success("Lead created")
        notify.error("Session expired", { id: "auth-401" })
        notify.info("Call Asha Rao", { id: "lead-source-call" })
        expect(show).toHaveBeenCalledTimes(4)
    })
})

describe("what reaches the toast host", () => {
    test("type, message, description, duration and the action button", () => {
        const onClick = jest.fn()
        notify.warning("3 rows were skipped", {
            description: "See the upload report.",
            duration: 6000,
            action: { label: "Open", onClick },
        })
        expect(show).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "warning",
                text1: "3 rows were skipped",
                text2: "See the upload report.",
                visibilityTime: 6000,
                props: { action: { label: "Open", onClick } },
            }),
        )
    })

    test("each of the four types", () => {
        notify.success("a")
        notify.error("b")
        notify.info("c")
        notify.warning("d")
        expect(show.mock.calls.map(([params]) => params.type)).toEqual(["success", "error", "info", "warning"])
    })

    test("dismiss hides the toast and frees its id", () => {
        notify.error("Session expired", { id: "auth-401" })
        notify.dismiss()
        expect(Toast.hide).toHaveBeenCalled()
        notify.error("Session expired", { id: "auth-401" })
        expect(show).toHaveBeenCalledTimes(2)
    })
})
