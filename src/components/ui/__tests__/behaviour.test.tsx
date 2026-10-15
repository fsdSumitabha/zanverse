import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { useState } from "react"
import {
    BackHandler,
    Image,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type EmitterSubscription,
    type KeyboardEvent,
    type ViewStyle,
} from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import ReactTestRenderer from "react-test-renderer"

import Avatar from "@/components/ui/Avatar"
import Dialog from "@/components/ui/Dialog"
import DialogHost from "@/components/ui/DialogHost"
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

/** An open sheet's content carries accessibilityViewIsModal. A closed sheet renders nothing. */
function isSheetOpen(renderer: Renderer): boolean {
    return renderer.root.findAll((node) => node.props.accessibilityViewIsModal === true).length > 0
}

type BackListener = Parameters<typeof BackHandler.addEventListener>[1]

// The event a back press passes. The sheets do not read it.
const BACK_EVENT = {} as Parameters<BackListener>[0]

/** Presses the Android back button: the newest listener is asked first, as BackHandler does. */
async function pressBack(listeners: BackListener[]) {
    await ReactTestRenderer.act(async () => {
        for (const listener of [...listeners].reverse()) if (listener(BACK_EVENT)) break
    })
}

let backListeners: BackListener[] = []

beforeEach(() => {
    backListeners = []
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, listener) => {
        backListeners.push(listener)
        return { remove: () => (backListeners = backListeners.filter((item) => item !== listener)) }
    })
})

afterEach(() => jest.restoreAllMocks())

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
        // Edge-to-edge: Android does not resize the window for the keyboard, so the sheet lifts itself.
        const sheet = renderer.root.findByType(BottomSheetModal)
        expect(sheet.props.keyboardBehavior).toBe("interactive")
        expect(sheet.props.android_keyboardInputMode).toBe("adjustPan")

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
        await pressBack(backListeners)
        expect(isSheetOpen(renderer)).toBe(false)
        expect(backListeners).toHaveLength(0)

        await press(trigger)
        await press(getCloseButtons(renderer)[0])
        expect(isSheetOpen(renderer)).toBe(false)
    })
})

describe("Dialog", () => {
    const originalOs = Platform.OS

    afterEach(() => {
        Object.defineProperty(Platform, "OS", { configurable: true, get: () => originalOs })
    })

    /** The view that centres the card in the space the system bars and the keyboard leave free. */
    function getDialogFrame(renderer: Renderer): Node {
        return renderer.root.find((node) => (node.type as unknown) === "View" && node.props.pointerEvents === "box-none")
    }

    function getFrameStyle(renderer: Renderer): ViewStyle {
        return StyleSheet.flatten(getDialogFrame(renderer).props.style as ViewStyle) ?? {}
    }

    function DialogOwner({ isOpen, onClose = jest.fn() }: { isOpen: boolean; onClose?: () => void }) {
        return (
            <Dialog open={isOpen} onClose={onClose} title="Add a note">
                <Text>Body</Text>
            </Dialog>
        )
    }

    test("shows its title, body and footer in a card centred on the screen, not in a bottom sheet", async () => {
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
        expect(renderer.root.findAllByType(BottomSheetModal)).toHaveLength(0)
        expect(getFrameStyle(renderer)).toMatchObject({ alignItems: "center", justifyContent: "center" })
    })

    test("closes a keyboard left open by the screen behind it, as it opens", async () => {
        const dismiss = jest.spyOn(Keyboard, "dismiss")
        const renderer = await renderTree(<DialogOwner isOpen={false} />)
        expect(dismiss).not.toHaveBeenCalled()

        await ReactTestRenderer.act(async () => renderer.update(<DialogOwner isOpen />))
        expect(dismiss).toHaveBeenCalledTimes(1)
    })

    test("keeps clear of the system bars, and rises above the keyboard while its own field is typed in", async () => {
        Object.defineProperty(Platform, "OS", { configurable: true, get: () => "android" })
        const keyboardListeners = new Map<string, (event: KeyboardEvent) => void>()
        jest.spyOn(Keyboard, "addListener").mockImplementation((eventName, listener) => {
            keyboardListeners.set(eventName, listener as (event: KeyboardEvent) => void)
            return { remove: () => keyboardListeners.delete(eventName) } as unknown as EmitterSubscription
        })
        const metrics = { frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 24, right: 0, bottom: 48, left: 0 } }
        const renderer = await renderTree(
            <SafeAreaProvider initialMetrics={metrics}>
                <DialogOwner isOpen />
            </SafeAreaProvider>,
        )
        // 24 dp from the status bar and from the navigation bar.
        expect(getFrameStyle(renderer)).toMatchObject({ paddingTop: 48, paddingBottom: 72 })

        // Android reports the keyboard without the navigation bar under it.
        const keyboard = { endCoordinates: { height: 300, screenX: 0, screenY: 452, width: 360 } } as KeyboardEvent
        await ReactTestRenderer.act(async () => keyboardListeners.get("keyboardDidShow")?.(keyboard))
        expect(getFrameStyle(renderer).paddingBottom).toBe(300 + 48 + 24)

        await ReactTestRenderer.act(async () => keyboardListeners.get("keyboardDidHide")?.(keyboard))
        expect(getFrameStyle(renderer).paddingBottom).toBe(72)
    })

    test("draws on the DialogHost layer, outside the scroll view it is written in", async () => {
        function Screen({ isOpen }: { isOpen: boolean }) {
            return (
                <DialogHost>
                    <ScrollView testID="screen">
                        <DialogOwner isOpen={isOpen} />
                    </ScrollView>
                </DialogHost>
            )
        }
        const renderer = await renderTree(<Screen isOpen />)
        expect(isSheetOpen(renderer)).toBe(true)
        const screen = renderer.root.findByProps({ testID: "screen" })
        expect(screen.findAll((node) => node.props.accessibilityViewIsModal === true)).toHaveLength(0)

        await ReactTestRenderer.act(async () => renderer.update(<Screen isOpen={false} />))
        expect(isSheetOpen(renderer)).toBe(false)
    })

    test("back, the scrim and the X button each call onClose", async () => {
        const onClose = jest.fn()
        const renderer = await renderTree(<DialogOwner isOpen onClose={onClose} />)
        await pressBack(backListeners)
        // The owner keeps it open here, so each press reaches onClose.
        const [scrim, xButton] = getCloseButtons(renderer)
        await press(xButton)
        await press(scrim)
        expect(onClose).toHaveBeenCalledTimes(3)
    })

    test("a dialog closed by its owner does not report a close of its own", async () => {
        const onClose = jest.fn()
        const renderer = await renderTree(<DialogOwner isOpen onClose={onClose} />)
        expect(isSheetOpen(renderer)).toBe(true)
        await ReactTestRenderer.act(async () => renderer.update(<DialogOwner isOpen={false} onClose={onClose} />))
        expect(isSheetOpen(renderer)).toBe(false)
        expect(onClose).not.toHaveBeenCalled()
        expect(backListeners).toHaveLength(0)
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
