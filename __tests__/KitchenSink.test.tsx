import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import KitchenSinkScreen from "@/screens/dev/KitchenSinkScreen"

// Skeleton pulses and toasts start timers. Fake timers let the test flush them before Jest tears down.
jest.useFakeTimers()

// One section per primitive in the session 3 scope.
const SECTION_TITLES = [
    "Badge",
    "TemporalBadge",
    "NotificationBadge",
    "Button",
    "Card",
    "SectionHeader",
    "Pagination",
    "Input",
    "Textarea",
    "SelectSheet",
    "Dialog",
    "Skeleton",
    "EmptyState",
    "AccessDenied",
    "Toast and notify",
    "Theme",
    "Avatar",
    "TimeAgo",
    "InlineValue",
    "Fab",
]

function getTexts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

test("renders the kitchen sink with a labelled section for every primitive", async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<KitchenSinkScreen />)
    })
    const texts = getTexts(renderer!)

    expect(texts).toContain("Kitchen sink")
    for (const title of SECTION_TITLES) {
        expect([title, texts.includes(title)]).toEqual([title, true])
    }
    // The retired lead source status 60 renders, as the grey Unknown pill.
    expect(texts).toContain("Unknown")
    expect(texts).toContain("Access Denied")

    await ReactTestRenderer.act(async () => {
        renderer!.unmount()
        jest.runOnlyPendingTimers()
    })
})
