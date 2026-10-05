import { colorScheme } from "nativewind"
import { StyleSheet, Text, TextInput, type StyleProp, type TextStyle } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import { LEAD_SOURCE_STATUS_META } from "@/constants/leadSourceStatus"
import { LEAD_STATUS_META } from "@/constants/leadStatus"

import { injectAppStylesheet } from "../../../../jest/tailwindStyles"

// These tests render with the app's real compiled stylesheet and check the React Native styles that result.

type Renderer = ReactTestRenderer.ReactTestRenderer
type Node = ReactTestRenderer.ReactTestInstance

async function setScheme(scheme: "light" | "dark") {
    await ReactTestRenderer.act(async () => {
        colorScheme.set(scheme)
    })
}

async function renderTree(element: React.ReactElement): Promise<Renderer> {
    let renderer: Renderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(element)
    })
    return renderer!
}

function getStyle(node: Node): TextStyle {
    return StyleSheet.flatten(node.props.style as StyleProp<TextStyle>) ?? {}
}

function lower(value: unknown): unknown {
    return typeof value === "string" ? value.toLowerCase() : value
}

/** A host View: what View and Pressable render to in the test renderer. */
function isHostView(node: Node): boolean {
    return (node.type as unknown) === "View"
}

/** The Text whose content is `label`. */
function getText(renderer: Renderer, label: string): Node {
    return renderer.root.find((node) => node.type === Text && node.props.children === label)
}

/** The nearest host View above a node: for a Button, the Pressable's view. */
function getHostParentView(node: Node): Node {
    let current = node.parent
    while (current && !isHostView(current)) current = current.parent
    if (!current) throw new Error("no host View above the node")
    return current
}

beforeAll(async () => {
    await injectAppStylesheet()
})

afterEach(async () => {
    await setScheme("light")
})

describe("Badge", () => {
    test("renders a META map's colours unchanged", async () => {
        const renderer = await renderTree(<Badge meta={LEAD_SOURCE_STATUS_META} status={40} />)
        const style = getStyle(getText(renderer, "Interested"))
        expect(lower(style.backgroundColor)).toBe("#059669")
        expect(lower(style.color)).toBe("#ffffff")
    })

    test("a code missing from the map is a grey Unknown pill: the retired status 60", async () => {
        const renderer = await renderTree(<Badge meta={LEAD_SOURCE_STATUS_META} status={60} />)
        const style = getStyle(getText(renderer, "Unknown"))
        expect(lower(style.backgroundColor)).toBe("#6b7280")
        expect(lower(style.color)).toBe("#ffffff")
    })

    test("size sm uses the StatusPill text size", async () => {
        const renderer = await renderTree(<Badge meta={LEAD_STATUS_META} status={10} size="sm" />)
        expect(getStyle(getText(renderer, "New Lead")).fontSize).toBe(11)
    })
})

describe("Button", () => {
    test("primary: the background goes on the pressable and the text colour on the Text", async () => {
        const renderer = await renderTree(<Button label="Save" onPress={() => undefined} />)
        const text = getText(renderer, "Save")
        expect(lower(getStyle(text).color)).toBe("#ffffff")
        expect(getStyle(text).backgroundColor).toBeUndefined()
        expect(lower(getStyle(getHostParentView(text)).backgroundColor)).toBe("#2563eb")
    })

    test("quiet follows the colour scheme", async () => {
        const light = await renderTree(<Button label="Cancel" variant="quiet" onPress={() => undefined} />)
        expect(lower(getStyle(getText(light, "Cancel")).color)).toBe("#404040")
        expect(lower(getStyle(getHostParentView(getText(light, "Cancel"))).borderColor)).toBe("#cbd5e1")

        await setScheme("dark")
        const dark = await renderTree(<Button label="Cancel" variant="quiet" onPress={() => undefined} />)
        expect(lower(getStyle(getText(dark, "Cancel")).color)).toBe("#e5e5e5")
        expect(lower(getStyle(getHostParentView(getText(dark, "Cancel"))).borderColor)).toBe("#404040")
    })

    test("disabled is half opacity and does not press", async () => {
        const onPress = jest.fn()
        const renderer = await renderTree(<Button label="Save" disabled onPress={onPress} />)
        const view = getHostParentView(getText(renderer, "Save"))
        expect(getStyle(view).opacity).toBe(0.5)
        expect(view.props.accessibilityState).toMatchObject({ disabled: true })
    })
})

describe("Card", () => {
    test("white with a gray-200 border in light mode, neutral-900 and neutral-800 in dark mode", async () => {
        const light = await renderTree(<Card testID="card" />)
        const lightStyle = getStyle(light.root.find((node) => isHostView(node) && node.props.testID === "card"))
        expect(lower(lightStyle.backgroundColor)).toBe("#ffffff")
        expect(lower(lightStyle.borderColor)).toBe("#e5e7eb")
        expect(lightStyle.elevation).toBe(1)

        await setScheme("dark")
        const dark = await renderTree(<Card testID="card" />)
        const darkStyle = getStyle(dark.root.find((node) => isHostView(node) && node.props.testID === "card"))
        expect(lower(darkStyle.backgroundColor)).toBe("#171717")
        expect(lower(darkStyle.borderColor)).toBe("#262626")
    })
})

describe("Input", () => {
    test("uses the web's FIELD colours, and a server error turns the border red", async () => {
        const plain = await renderTree(<Input label="Name" value="" onChangeText={() => undefined} />)
        const plainStyle = getStyle(plain.root.findByType(TextInput))
        expect(lower(plainStyle.backgroundColor)).toBe("#ffffff")
        expect(lower(plainStyle.borderColor)).toBe("#cbd5e1")

        const failed = await renderTree(
            <Input label="Phone" value="x" error="Enter a number" onChangeText={() => undefined} />,
        )
        expect(lower(getStyle(failed.root.findByType(TextInput)).borderColor)).toBe("#ef4444")
        expect(getText(failed, "Enter a number")).toBeTruthy()
    })

    test("dark mode uses the neutral-800 field", async () => {
        await setScheme("dark")
        const renderer = await renderTree(<Input value="" onChangeText={() => undefined} />)
        expect(lower(getStyle(renderer.root.findByType(TextInput)).backgroundColor)).toBe("#262626")
    })
})
