import { keepLocalCopy, pick } from "@react-native-documents/picker"
import { FlatList } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"
import ReactTestRenderer from "react-test-renderer"

import { API_BASE_URL } from "@/api/endpoints"
import { navigationRef } from "@/api/navigationRef"
import { notify } from "@/lib/notify"
import LeadSourceReportScreen from "@/screens/leadSources/LeadSourceReportScreen"
import { clearToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    getCalls,
    getTexts,
    installFetchMock,
    press,
    renderApp,
    respond,
    routeFetch,
    typeInto,
    unmountApp,
    type FetchMock,
    type FetchRoute,
} from "../jest/appHarness"

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
const UPLOADS = "/api/admin/operations/lead-sources/uploads"
const blob = ReactNativeBlobUtil as unknown as { fetch: jest.Mock; config: jest.Mock }

const SUMMARY = {
    _id: "up1",
    region: "IN",
    fileName: "october.xlsx",
    status: 20,
    uploadedBy: { _id: "u1", name: "Asha Rao" },
    assignedTo: { _id: "u2", name: "Ravi Kumar" },
    allottedDay: "2026-10-07",
    counts: { read: 60, imported: 57, warned: 2, skipped: 3 },
    createdAt: "2026-10-06T08:00:00Z",
}

function makeRows(count: number) {
    return Array.from({ length: count }, (_, i) => {
        const n = i + 2
        const result = n === 3 ? 30 : n === 4 ? 20 : 10
        return {
            n,
            values: [`Name ${n}`, `+9198765${String(n).padStart(5, "0")}`, n === 5 ? "Pune" : ""],
            result,
            messages: result === 30 ? ["No phone number."] : result === 20 ? ["The email was not valid."] : [],
            ...(result === 30 ? {} : { sourceId: `src${n}` }),
        }
    })
}

function makeReport(overrides: object = {}) {
    return {
        ...SUMMARY,
        sheetName: "Sheet1",
        headerRow: 1,
        columns: [
            { key: "name", header: "Name", label: "Name", known: true },
            { key: "phone", header: "Phone", label: "Phone", known: true },
            { key: "city", header: "City", label: "City", known: true },
        ],
        missingColumns: ["email", "company"],
        fileNotes: ["The country column was empty, so India was used."],
        rows: makeRows(60),
        ...overrides,
    }
}

let fetchMock: FetchMock
let report: object

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/lead-sources\?/,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [],
                    pagination: { page: 1, limit: 50, total: 57, pages: 2 },
                    counts: { today: 0, upcoming: 0, unscheduled: 0, closed: 0, all: 57, callbacksDue: 0 },
                    progress: { total: 0, worked: 0 },
                }),
        },
        {
            path: /^\/api\/admin\/operations\/lead-sources\/assignees/,
            reply: () => respond(200, { success: true, data: [] }),
        },
        {
            path: `${UPLOADS}?page=1&limit=20`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [
                        SUMMARY,
                        {
                            ...SUMMARY,
                            _id: "up2",
                            fileName: "broken.csv",
                            status: 30,
                            counts: { read: 0, imported: 0, warned: 0, skipped: 0 },
                        },
                    ],
                    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
                }),
        },
        { path: `${UPLOADS}/up1`, reply: () => respond(200, { success: true, data: report }) },
    ]
}

async function openCalls(user: object = ADMIN, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Calls"))
    return renderer
}

function pickFile(name: string, size: number) {
    ;(pick as jest.Mock).mockResolvedValue([{ uri: "content://picked/1", name, size, type: XLSX }])
    ;(keepLocalCopy as jest.Mock).mockResolvedValue([
        { status: "success", sourceUri: "content://picked/1", localUri: `file:///data/cache/${name}` },
    ])
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    report = makeReport()
    await clearToken()
    saveActiveRegion(null)
})

describe("sheet upload", () => {
    it("uploads a picked sheet with progress and lands on the report", async () => {
        const success = jest.spyOn(notify, "success")
        let finish: (value: unknown) => void = () => undefined
        let reportProgress: (sent: number, total: number) => void = () => undefined
        blob.fetch.mockReturnValue({
            uploadProgress: (_config: unknown, onSent: (sent: number, total: number) => void) => {
                reportProgress = onSent
                return new Promise((resolve) => {
                    finish = resolve
                })
            },
        })
        pickFile("october.xlsx", 3 * 1024)
        const renderer = await openCalls()

        await press(findPressableByText(renderer, "Upload sheet"))
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["1. The sheet", "Download the template to see the expected header row."]),
        )
        await press(findPressableByText(renderer, "Choose a file"))
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["october.xlsx", "3 KB · tap to choose another file"]),
        )

        await press(findPressableByText(renderer, "Upload and check"))
        await ReactTestRenderer.act(async () => reportProgress(512, 1024))
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "Checking and importing...",
                "50%",
                "Stay on this screen until the upload finishes.",
            ]),
        )

        // Back is blocked while the upload is in flight.
        await ReactTestRenderer.act(async () => navigationRef.goBack())
        expect(getTexts(renderer)).toContain("Checking and importing...")

        await ReactTestRenderer.act(async () =>
            finish({
                info: () => ({ status: 201 }),
                json: () => ({
                    success: true,
                    data: { uploadId: "up1", counts: { read: 3, imported: 3, warned: 0, skipped: 0 } },
                }),
            }),
        )
        await flush()
        expect(success).toHaveBeenCalledWith("3 imported.")
        expect(renderer.root.findAllByType(LeadSourceReportScreen)).toHaveLength(1)
        expect(getCalls(fetchMock)).toContain(`GET ${UPLOADS}/up1`)
        await unmountApp(renderer)
    })

    it("refuses an .xls on the phone and sends nothing", async () => {
        pickFile("old.xls", 2048)
        const renderer = await openCalls()

        await press(findPressableByText(renderer, "Upload sheet"))
        await press(findPressableByText(renderer, "Choose a file"))
        expect(getTexts(renderer)).toContain(
            "Choose an .xlsx or a .csv file. For an old .xls file, save it as .xlsx first.",
        )
        expect(blob.fetch).not.toHaveBeenCalled()
        await unmountApp(renderer)
    })

    it("shows the server's refusal with the headers found, and keeps the file", async () => {
        blob.fetch.mockReturnValue({
            uploadProgress: () =>
                Promise.resolve({
                    info: () => ({ status: 400 }),
                    json: () => ({
                        success: false,
                        message: "The file has no phone column. Add one and upload it again.",
                        details: { missing: ["phone"], found: ["name", "mobile no"] },
                    }),
                }),
        })
        pickFile("october.xlsx", 3 * 1024)
        const renderer = await openCalls()

        await press(findPressableByText(renderer, "Upload sheet"))
        await press(findPressableByText(renderer, "Choose a file"))
        await press(findPressableByText(renderer, "Upload and check"))

        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "The file has no phone column. Add one and upload it again.",
                "name, mobile no",
                "Nothing was saved. Fix the file and upload it again.",
                "october.xlsx",
                "Upload and check",
            ]),
        )
        await unmountApp(renderer)
    })
})

describe("uploads and reports", () => {
    async function openReport() {
        const renderer = await openCalls()
        await press(findPressableByText(renderer, "Uploads"))
        await press(findPressable(renderer, "october.xlsx"))
        return renderer
    }

    it("lists past uploads with the counters and a Failed chip", async () => {
        const renderer = await openCalls()
        await press(findPressableByText(renderer, "Uploads"))

        expect(getCalls(fetchMock)).toContain(`GET ${UPLOADS}?page=1&limit=20`)
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "october.xlsx",
                "broken.csv",
                "Failed",
                "57 imported",
                "2 warnings",
                "3 skipped",
                "Asha Rao ·",
            ]),
        )
        await unmountApp(renderer)
    })

    it("shows the report header, the tiles, the notes and both downloads", async () => {
        const fetchFile = jest.fn().mockResolvedValue({ info: () => ({ status: 200 }), path: () => "/cache/f.xlsx" })
        blob.config.mockReturnValue({ fetch: fetchFile })
        const renderer = await openReport()

        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "Rows read",
                "60",
                "57",
                "With warnings",
                "The country column was empty, so India was used.",
                "Not in this file, so left empty: email, company.",
                "Open the 57 imported sources",
                "Skipped rows only",
            ]),
        )
        await press(findPressableByText(renderer, "Skipped rows only"))
        // The cache on Android, Documents on iOS (Jest runs as iOS).
        expect(blob.config).toHaveBeenCalledWith({
            fileCache: true,
            path: expect.stringMatching(/^\/(data|var)\/.+\/october-report-skipped\.xlsx$/),
        })
        expect(fetchFile.mock.calls[0][1]).toBe(`${API_BASE_URL}${UPLOADS}/up1/download?only=skipped`)
        await unmountApp(renderer)
    })

    it("hides Skipped rows only when nothing was skipped", async () => {
        report = makeReport({ counts: { read: 3, imported: 3, warned: 0, skipped: 0 }, rows: makeRows(1) })
        const renderer = await openReport()
        expect(getTexts(renderer)).not.toContain("Skipped rows only")
        await unmountApp(renderer)
    })

    it("filters, searches and pages the row cards, and opens a source", async () => {
        const renderer = await openReport()
        const list = () => renderer.root.findByType(LeadSourceReportScreen).findByType(FlatList)

        expect(list().props.data).toHaveLength(50)
        await ReactTestRenderer.act(async () => list().props.onEndReached())
        expect(list().props.data).toHaveLength(60)

        await press(findPressableByText(renderer, "Skipped 1"))
        expect(list().props.data.map((row: { n: number }) => row.n)).toEqual([3])
        await press(findPressableByText(renderer, "With warnings 1"))
        expect(list().props.data.map((row: { n: number }) => row.n)).toEqual([4])
        await press(findPressableByText(renderer, "All rows 60"))
        await typeInto(renderer, "Find in the report", "pune")
        expect(list().props.data.map((row: { n: number }) => row.n)).toEqual([5])

        await press(findPressable(renderer, "Open the lead source from row 5"))
        expect(getCalls(fetchMock)).toContain("GET /api/admin/operations/lead-sources/src5")
        await unmountApp(renderer)
    })

    it("opens the imported sources as the list filtered by the upload", async () => {
        const renderer = await openReport()
        await press(findPressableByText(renderer, "Open the 57 imported sources"))

        const listCalls = getCalls(fetchMock).filter((call) =>
            call.startsWith("GET /api/admin/operations/lead-sources?"),
        )
        expect(listCalls.at(-1)).toBe(
            "GET /api/admin/operations/lead-sources?view=all&today=2026-10-06&page=1&limit=50&upload=up1",
        )
        expect(getTexts(renderer)).toContain("Showing one upload only.")
        await unmountApp(renderer)
    })

    it("keeps a role-60 account out: no entry points and AccessDenied on the screens", async () => {
        const renderer = await openCalls(AGENT)
        expect(getTexts(renderer)).not.toContain("Upload sheet")
        expect(getTexts(renderer)).not.toContain("Uploads")

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", { screen: "CallsTab", params: { screen: "LeadSourceUploads" } })
        })
        await flush()
        expect(getTexts(renderer)).toContain("Access Denied")
        await unmountApp(renderer)
    })
})
