import Clipboard from "@react-native-clipboard/clipboard"
import { Linking, Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { API_BASE_URL } from "@/api/endpoints"
import EditHistory from "@/components/interactions/EditHistory"
import InteractionEditor from "@/components/interactions/InteractionEditor"
import InteractionItem from "@/components/interactions/InteractionItem"
import type { TimelineItem } from "@/components/interactions/timelineTypes"
import { getFileRejection } from "@/components/ui"
import { getTimelinePath } from "@/hooks/useInteractions"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"

jest.useFakeTimers()

const mockAuth = { role: 10 as number | null }
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }))
const mockSend = jest.fn()
jest.mock("@/api/client", () => ({
    ...jest.requireActual("@/api/client"),
    send: (...args: unknown[]) => mockSend(...args),
}))

type Renderer = ReactTestRenderer.ReactTestRenderer

const BASE: TimelineItem = {
    _id: "i1",
    type: 2110,
    title: "Kickoff",
    description: "Wants a demo",
    createdAt: "2026-09-01T10:00:00.000Z",
    createdBy: { _id: "u1", name: "Asha Rao" },
    editHistory: [],
}

async function render(element: React.ReactElement): Promise<Renderer> {
    let renderer: Renderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(element)
    })
    return renderer!
}

function getTexts(renderer: Renderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

function hasLabel(renderer: Renderer, label: string): boolean {
    return renderer.root.findAll((node) => node.props.accessibilityLabel === label && !!node.props.onPress).length > 0
}

function renderItem(item: Partial<TimelineItem>, entityType = 0) {
    return render(<InteractionItem entityType={entityType} item={{ ...BASE, ...item }} />)
}

beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.role = 10
})

describe("timeline rows", () => {
    it("renders a note with its badge, description, Created by, and the pencil for an edit role", async () => {
        const renderer = await renderItem({})
        const texts = getTexts(renderer)

        expect(texts).toEqual(expect.arrayContaining(["Kickoff", "Note Added", "Wants a demo", "Created by Asha Rao"]))
        expect(hasLabel(renderer, "Edit note")).toBe(true)
    })

    it("hides the pencil from a role outside the edit roles", async () => {
        mockAuth.role = 30
        const note = await renderItem({})
        const status = await renderItem({ type: 2510, title: JSON.stringify({ from: 10, to: 20 }) })

        expect(hasLabel(note, "Edit note")).toBe(false)
        expect(hasLabel(status, "Edit remarks")).toBe(false)
    })

    it("renders a status change with both pills from STATUS_META_BY_ENTITY and the remarks", async () => {
        const renderer = await renderItem({ type: 2510, title: JSON.stringify({ action: "status", from: 10, to: 20 }) })
        const texts = getTexts(renderer)

        expect(texts).toEqual(expect.arrayContaining(["Status Changed", "New Lead", "Contacted", "Wants a demo"]))
        expect(hasLabel(renderer, "Edit remarks")).toBe(true)
    })

    it("renders a completed meeting with meeting null, without crashing", async () => {
        const renderer = await renderItem({ type: 2050, title: "Demo done", meeting: null })

        expect(getTexts(renderer)).toContain("Demo done")
    })

    it("renders an online meeting with Join and Copy", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const renderer = await renderItem({
            type: 2010,
            title: "Discovery",
            meeting: {
                _id: "m1",
                status: 2010,
                meetingType: 0,
                meetingLink: "https://meet.example/abc",
                agenda: "Scope",
                scheduledAt: "2026-10-06T10:00:00.000Z",
            },
        })

        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["Meeting Scheduled", "Agenda: Scope", "Join", "Copy"]),
        )
        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "Join meeting" }).props.onPress(),
        )
        expect(open).toHaveBeenCalledWith("https://meet.example/abc")

        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "Copy meeting link" }).props.onPress(),
        )
        expect(Clipboard.setString).toHaveBeenCalledWith("https://meet.example/abc")
        expect(getTexts(renderer)).toContain("Copied")
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1500))
        expect(getTexts(renderer)).toContain("Copy")
    })

    it("renders a call and opens the relative recording on the API host", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const renderer = await renderItem({
            type: 2210,
            title: "Follow-up",
            call: {
                _id: "c1",
                contactPersonName: "Ravi",
                contactPersonPhone: "+919876543210",
                direction: 1,
                duration: 12,
                notes: "Asked for pricing",
                recordingUrl: "/uploads/calls/rec.m4a",
            },
        })

        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["Call Made", "Ravi", "Inbound", "12 minutes", "Asked for pricing", "Recording"]),
        )
        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "Open recording" }).props.onPress(),
        )
        expect(open).toHaveBeenCalledWith(`${API_BASE_URL}/uploads/calls/rec.m4a`)
    })

    it("renders a quotation with the GST-inclusive total", async () => {
        const renderer = await renderItem({
            type: 2410,
            title: "Website",
            quotation: { _id: "q1", amount: 100000, gst_percentage: 18, url: "https://ik.imagekit.io/x/q.pdf" },
        })
        const texts = getTexts(renderer).join(" | ")

        expect(texts).toContain("₹1,00,000")
        expect(texts).toContain(" + 18% GST ")
        expect(texts).toContain("Amount Inclusive GST : ₹1,18,000")
        expect(hasLabel(renderer, "Download quotation")).toBe(true)
    })

    it("renders a document row, which the web leaves blank", async () => {
        const renderer = await renderItem({
            type: 2310,
            title: "Brief",
            document: { _id: "d1", title: "brief.pdf", url: "/uploads/d.pdf" },
        })

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Brief", "Document Uploaded", "brief.pdf"]))
    })
})

describe("InteractionEditor", () => {
    it("keeps Save disabled until something changes, then PATCHes only the changed keys", async () => {
        mockSend.mockResolvedValueOnce({})
        const onSaved = jest.fn()
        const renderer = await render(
            <InteractionEditor
                interactionId="i1"
                initialTitle="Kickoff"
                initialDescription="Old"
                onCancel={jest.fn()}
                onSaved={onSaved}
            />,
        )
        const findSave = () =>
            renderer.root.find((node) => node.props.accessibilityLabel === "Save" && !!node.props.onPress)

        expect(findSave().props.disabled).toBe(true)
        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "Description", multiline: true }).props.onChangeText("New"),
        )
        expect(findSave().props.disabled).toBe(false)
        await ReactTestRenderer.act(async () => findSave().props.onPress())

        expect(mockSend).toHaveBeenCalledWith("/api/admin/operations/interactions/i1", "PATCH", { description: "New" })
        expect(onSaved).toHaveBeenCalledTimes(1)
    })
})

describe("EditHistory", () => {
    it("says Edited once and shows the previous value", async () => {
        const renderer = await render(
            <EditHistory
                history={[
                    { oldDescription: "First draft", editedBy: { name: "Asha Rao" }, editedAt: "2026-09-02T10:00:00Z" },
                ]}
                createdBy={{ name: "Ravi" }}
                createdAt="2026-09-01T10:00:00Z"
            />,
        )
        expect(getTexts(renderer)).toContain("Edited once")

        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "Edited once. Show history" }).props.onPress(),
        )
        const texts = getTexts(renderer)
        expect(texts).toContain("Previous value:")
        expect(texts.join(" ")).toContain("First draft")
        // "Created by <bold name>": the name is its own nested Text.
        expect(texts).toContain("Ravi")
    })

    it("counts twice, thrice and N times, and names a missing person", async () => {
        const entry = { editedAt: "2026-09-02T10:00:00Z" }
        for (const [count, word] of [
            [2, "twice"],
            [3, "thrice"],
            [5, "5 times"],
        ] as const) {
            const renderer = await render(<EditHistory history={Array.from({ length: count }, () => entry)} />)
            expect(getTexts(renderer)).toContain(`Edited ${word}`)
            expect(getTexts(renderer)).toContain("Someone")
        }
    })
})

describe("file rules", () => {
    const QUOTATION = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    it("rejects a .txt with react-dropzone's allowlist message", () => {
        expect(getFileRejection({ type: "text/plain", size: 10 }, QUOTATION, 10 * 1024 * 1024)).toBe(
            "File type must be one of application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    })

    it("rejects a file over the size limit, and accepts wildcard audio", () => {
        expect(getFileRejection({ type: "application/pdf", size: 11 }, QUOTATION, 10)).toBe(
            "File is larger than 10 bytes",
        )
        expect(getFileRejection({ type: "audio/mpeg", size: 10 }, ["audio/*"], 100)).toBeNull()
        expect(getFileRejection({ type: "video/mp4", size: 10 }, ["audio/*"], 100)).toBe("File type must be audio/*")
    })
})

describe("toastPromise", () => {
    it("shows loading, then success in the same toast", async () => {
        const info = jest.spyOn(notify, "info")
        const success = jest.spyOn(notify, "success")

        await toastPromise(Promise.resolve("ok"), {
            loading: "Saving note...",
            success: "Note added successfully",
            error: "x",
        })
        await Promise.resolve()

        const id = info.mock.calls[0][1]?.id
        expect(info).toHaveBeenCalledWith("Saving note...", expect.objectContaining({ id }))
        expect(success).toHaveBeenCalledWith("Note added successfully", { id })
    })

    it("turns into the error text on failure", async () => {
        const error = jest.spyOn(notify, "error")

        await toastPromise(Promise.reject(new Error("Boom")), {
            loading: "Saving...",
            success: "ok",
            error: (err) => (err as Error).message,
        }).catch(() => undefined)
        await Promise.resolve()

        expect(error).toHaveBeenCalledWith("Boom", expect.objectContaining({ id: expect.any(String) }))
    })
})

describe("getTimelinePath", () => {
    it("maps leads, clients and projects, and nothing else", () => {
        expect(getTimelinePath(0, "x")).toBe("/api/admin/operations/leads/x/interactions")
        expect(getTimelinePath(1, "x")).toBe("/api/admin/operations/clients/x/interactions")
        expect(getTimelinePath(2, "x")).toBe("/api/admin/operations/projects/x/interactions")
        expect(getTimelinePath(3, "x")).toBeNull()
    })
})
