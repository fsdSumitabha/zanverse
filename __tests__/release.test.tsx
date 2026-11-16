import { Platform } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { API_BASE_URL } from "@/api/endpoints"
import { navigationRef } from "@/api/navigationRef"
import { clearToken, saveToken } from "@/store/keychain"
import { clearAll, saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    installFetchMock,
    press,
    renderApp,
    respond,
    routeFetch,
    unmountApp,
    type FetchMock,
} from "../jest/appHarness"

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const TODAY = "2026-10-06"
const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const UPLOADS = "/api/admin/operations/lead-sources/uploads"
const ROW = {
    _id: "a",
    name: "Source a",
    company: "",
    email: "",
    phone: "+919876543210",
    status: 10,
    region: "IN",
    allottedDay: TODAY,
    callbackAt: null,
    lastNote: "",
    lastNoteAt: null,
    uploadId: null,
    rowNumber: null,
    convertedLeadId: null,
    assignee: null,
    listInfo: [],
    section: 1,
}
const REPORT = {
    _id: "up1",
    region: "IN",
    fileName: "october.xlsx",
    status: 20,
    uploadedBy: { _id: "u1", name: "Asha Rao" },
    assignedTo: null,
    allottedDay: null,
    counts: { read: 3, imported: 3, warned: 0, skipped: 0 },
    createdAt: "2026-10-06T08:00:00Z",
    sheetName: "Lead sources",
    headerRow: 1,
    columns: [],
    missingColumns: [],
    fileNotes: [],
    rows: [],
}

let fetchMock: FetchMock

function hasTestId(renderer: ReactTestRenderer.ReactTestRenderer, testID: string): boolean {
    return renderer.root.findAll((node) => node.props.testID === testID).length > 0
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    clearAll()
    saveActiveRegion("IN")
})

describe("release build", () => {
    it("talks to the dev machine in a debug build: localhost on iOS, 10.0.2.2 on the Android emulator", () => {
        expect(API_BASE_URL).toBe(Platform.OS === "ios" ? "http://localhost:3000" : "http://10.0.2.2:3000")
    })

    it("carries every id the two Maestro flows tap", async () => {
        const signedOut = await renderApp()
        expect(["loginEmail", "loginPassword", "loginSubmit"].filter((id) => !hasTestId(signedOut, id))).toEqual([])
        await unmountApp(signedOut)

        await saveToken("jwt-1")
        routeFetch(fetchMock, [
            { path: "/api/auth/me", reply: () => respond(200, { success: true, data: ADMIN }) },
            {
                path: /^\/api\/admin\/operations\/lead-sources\?/,
                reply: () =>
                    respond(200, {
                        success: true,
                        data: [ROW],
                        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
                        counts: { today: 1, upcoming: 0, unscheduled: 0, closed: 0, all: 1, callbacksDue: 0 },
                        progress: { total: 1, worked: 0 },
                    }),
            },
            {
                path: /^\/api\/admin\/operations\/lead-sources\/assignees/,
                reply: () => respond(200, { success: true, data: [] }),
            },
            { path: `${UPLOADS}/up1`, reply: () => respond(200, { success: true, data: REPORT }) },
        ])
        const renderer = await renderApp()
        await press(findPressableByText(renderer, "Calls"))
        expect(
            ["leadSourceRow", "statusMenuTrigger", "uploadSheetButton"].filter((id) => !hasTestId(renderer, id)),
        ).toEqual([])

        await press(findPressable(renderer, "Status: New. Press to change."))
        expect(["statusOption-20", "statusNote", "statusSave"].filter((id) => !hasTestId(renderer, id))).toEqual([])

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "CallsTab",
                params: { screen: "LeadSourceUpload", initial: false },
            })
        })
        await flush()
        expect(["uploadPickFile", "uploadSubmit"].filter((id) => !hasTestId(renderer, id))).toEqual([])

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "CallsTab",
                params: { screen: "LeadSourceReport", params: { uploadId: "up1" }, initial: false },
            })
        })
        await flush()
        expect(hasTestId(renderer, "reportTileImported")).toBe(true)
        await unmountApp(renderer)
    })
})
