import { Text } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import ReactTestRenderer from "react-test-renderer"

import ToastHost from "@/components/ui/Toast"
import { notify } from "@/lib/notify"

// The real react-native-toast-message host, driven through notify, as the app uses it.

type Renderer = ReactTestRenderer.ReactTestRenderer

function getTexts(renderer: Renderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => String(node.props.children))
}

beforeEach(() => {
    jest.useFakeTimers()
})

afterEach(() => {
    jest.useRealTimers()
})

test("shows a notify toast with its description and action button, and the button runs the action", async () => {
    let renderer: Renderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
            <SafeAreaProvider>
                <ToastHost />
            </SafeAreaProvider>,
        )
    })

    const onCopy = jest.fn()
    await ReactTestRenderer.act(async () => {
        notify.info("Call Asha Rao", {
            id: "lead-source-call",
            description: "+91 98765 43210",
            action: { label: "Copy number", onClick: onCopy },
        })
    })
    expect(getTexts(renderer!)).toEqual(expect.arrayContaining(["Call Asha Rao", "+91 98765 43210", "Copy number"]))

    const action = renderer!.root.find(
        (node) =>
            node.props.accessibilityRole === "button" &&
            node.findAllByType(Text).some((text) => text.props.children === "Copy number"),
    )
    await ReactTestRenderer.act(async () => {
        action.props.onPress()
    })
    expect(onCopy).toHaveBeenCalledTimes(1)

    await ReactTestRenderer.act(async () => {
        renderer!.unmount()
        jest.runOnlyPendingTimers()
    })
})
