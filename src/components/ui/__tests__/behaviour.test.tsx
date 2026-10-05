import { useState } from "react"
import { Image, Modal, StyleSheet, Text, TextInput, type ViewStyle } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import ReactTestRenderer from "react-test-renderer"

import Avatar from "@/components/ui/Avatar"
import Dialog from "@/components/ui/Dialog"
import Fab from "@/components/ui/Fab"
import Pagination from "@/components/ui/Pagination"
import SelectSheet from "@/components/ui/SelectSheet"
import TimeAgo from "@/components/ui/TimeAgo"
import { formatFullDateTime, formatTimeAgo } from "@/lib/format"

type Renderer = ReactTestRenderer.ReactTestRenderer
type Node = ReactTestRenderer.ReactTestInstance

const OPTIONS = [
    { label: "New", value: 10 },
    { label: "Interested", value: 40 },
]

async function renderTree(element: React.ReactElement): Promise<Renderer> {
    let renderer: Renderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(element)
    })
    return renderer!
}

async function press(node: Node) {
    await ReactTestRenderer.act(async () => {
        node.props.onPress()
    })
}

function getTexts(renderer: Renderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => String(node.props.children))
}

/** Pressables labelled "Close": the sheet's backdrop, and the Dialog's X. */
function getCloseButtons(renderer: Renderer): Node[] {
    return renderer.root.findAll(
        (node) => node.props.accessibilityLabel === "Close" && typeof node.props.onPress === "function",
    )
}

function isSheetOpen(renderer: Renderer): boolean {
    return renderer.root.findAllByType(Modal).some((node) => node.props.visible)
}

function StatefulSelect({ onChange }: { onChange: (value: number) => void }) {
    const [value, setValue] = useState<number | null>(10)
    return (
        <SelectSheet
            label="Status"
            options={OPTIONS}
            value={value}
            onChange={(next) => {
                setValue(next)
                onChange(next)
            }}
        />
    )
}

describe("SelectSheet", () => {
    test("opens from the trigger, selects an option, and closes", async () => {
        const onChange = jest.fn()
        const renderer = await renderTree(<StatefulSelect onChange={onChange} />)
        expect(isSheetOpen(renderer)).toBe(false)

        await press(renderer.root.find((node) => node.props.accessibilityLabel === "Status: New"))
        expect(isSheetOpen(renderer)).toBe(true)

        const interested = renderer.root.find(
            (node) =>
                typeof node.props.onPress === "function" &&
                node.findAllByType(Text).some((t) => t.props.children === "Interested"),
        )
        await press(interested)
        expect(onChange).toHaveBeenCalledWith(40)
        expect(isSheetOpen(renderer)).toBe(false)
    })

    test("the Android back button and a backdrop tap both close it", async () => {
        const renderer = await renderTree(<StatefulSelect onChange={jest.fn()} />)
        const trigger = renderer.root.find((node) => node.props.accessibilityLabel === "Status: New")

        await press(trigger)
        await ReactTestRenderer.act(async () => {
            renderer.root.findByType(Modal).props.onRequestClose()
        })
        expect(isSheetOpen(renderer)).toBe(false)

        await press(trigger)
        await press(getCloseButtons(renderer)[0])
        expect(isSheetOpen(renderer)).toBe(false)
    })
})

describe("Dialog", () => {
    test("shows its title, body and footer, and lifts above the keyboard", async () => {
        const renderer = await renderTree(
            <Dialog
                open
                onClose={jest.fn()}
                title="Add a note"
                description="Shows on the timeline."
                footer={<Text>Footer</Text>}
            >
                <TextInput accessibilityLabel="Note" />
            </Dialog>,
        )
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Add a note", "Shows on the timeline.", "Footer"]))
        expect(renderer.root.findByProps({ accessibilityLabel: "Note" })).toBeTruthy()
        const keyboardAvoiding = renderer.root.find((node) => node.props.behavior === "padding")
        expect(keyboardAvoiding.props.enabled).toBe(true)
    })

    test("back, the backdrop and the X button each call onClose", async () => {
        const onClose = jest.fn()
        const renderer = await renderTree(
            <Dialog open onClose={onClose} title="Add a note">
                <Text>Body</Text>
            </Dialog>,
        )
        await ReactTestRenderer.act(async () => {
            renderer.root.findByType(Modal).props.onRequestClose()
        })
        for (const button of getCloseButtons(renderer)) await press(button)
        expect(onClose).toHaveBeenCalledTimes(3)
    })

    test("renders nothing while closed", async () => {
        const renderer = await renderTree(
            <Dialog open={false} onClose={jest.fn()} title="Hidden">
                <Text>Body</Text>
            </Dialog>,
        )
        expect(getTexts(renderer)).not.toContain("Hidden")
    })
})

describe("TimeAgo", () => {
    test("a press switches between the relative time and the full date", async () => {
        const date = new Date(Date.now() - 5 * 60_000)
        const renderer = await renderTree(<TimeAgo date={date} />)
        expect(getTexts(renderer)).toEqual([formatTimeAgo(date)])

        await press(renderer.root.find((node) => node.props.accessibilityRole === "button"))
        expect(getTexts(renderer)).toEqual([formatFullDateTime(date)])
    })
})

describe("Avatar", () => {
    test("loads the ImageKit URL at twice the size", async () => {
        const renderer = await renderTree(<Avatar uri="https://ik.imagekit.io/zan/a.jpg" size={40} name="Priya" />)
        expect(renderer.root.findByType(Image).props.source).toEqual({
            uri: "https://ik.imagekit.io/zan/a.jpg?tr=w-80,h-80,f-auto",
        })
    })

    test("a broken image falls back to the User icon", async () => {
        const renderer = await renderTree(<Avatar uri="https://ik.imagekit.io/zan/missing.jpg" name="Priya" />)
        await ReactTestRenderer.act(async () => {
            renderer.root.findByType(Image).props.onError()
        })
        expect(renderer.root.findAllByType(Image)).toHaveLength(0)
        expect(renderer.root.findByProps({ accessibilityLabel: "Priya's photo" })).toBeTruthy()
    })

    test("no avatar shows the fallback straight away", async () => {
        const renderer = await renderTree(<Avatar uri="" />)
        expect(renderer.root.findAllByType(Image)).toHaveLength(0)
    })
})

describe("Fab", () => {
    const METRICS = {
        insets: { top: 24, bottom: 48, left: 0, right: 0 },
        frame: { x: 0, y: 0, width: 400, height: 800 },
    }

    async function getFabStyle(extraBottom?: number): Promise<ViewStyle> {
        const renderer = await renderTree(
            <SafeAreaProvider initialMetrics={METRICS}>
                <Fab accessibilityLabel="Add" onPress={jest.fn()} extraBottom={extraBottom} />
            </SafeAreaProvider>,
        )
        const fab = renderer.root.find((node) => node.props.accessibilityLabel === "Add" && node.props.style)
        return StyleSheet.flatten(fab.props.style)
    }

    test("sits 16 above the gesture bar inset", async () => {
        expect(await getFabStyle()).toMatchObject({ bottom: 48 + 16, right: 16 })
    })

    test("adds extraBottom on top", async () => {
        expect(await getFabStyle(30)).toMatchObject({ bottom: 48 + 30 + 16 })
    })
})

describe("Pagination", () => {
    test("disables Previous on the first page and Next on the last", async () => {
        const onChange = jest.fn()
        const first = await renderTree(<Pagination page={1} totalPages={3} onChange={onChange} />)
        const buttons = first.root.findAll((node) => node.props.accessibilityRole === "button" && node.props.onPress)
        expect(buttons.map((node) => node.props.disabled)).toEqual([true, false])

        await press(buttons[1])
        expect(onChange).toHaveBeenCalledWith(2)

        const last = await renderTree(<Pagination page={3} totalPages={3} onChange={onChange} />)
        const lastButtons = last.root.findAll((node) => node.props.accessibilityRole === "button" && node.props.onPress)
        expect(lastButtons.map((node) => node.props.disabled)).toEqual([false, true])
    })
})
