import { launchCamera, launchImageLibrary } from "react-native-image-picker"

import { notify } from "@/lib/notify"
import ProfileEditScreen from "@/screens/profile/ProfileEditScreen"
import ProfileScreen from "@/screens/profile/ProfileScreen"
import { clearToken, getToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    getCalls,
    getTexts,
    installFetchMock,
    installRecordingFormData,
    press,
    renderApp,
    respond,
    routeFetch,
    typeInto,
    unmountApp,
    type FetchMock,
    type FetchRoute,
    type FormPart,
} from "../jest/appHarness"

jest.useFakeTimers()

const ME = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const PROFILE = {
    id: "u1",
    name: "Asha Rao",
    email: "asha@zan.test",
    role: 10,
    isActive: true,
    avatar: "",
    lastLoginAt: null,
    createdAt: new Date(2026, 8, 1, 15, 7).toISOString(),
    updatedAt: new Date(2026, 9, 2, 9, 30).toISOString(),
    createdBy: { id: "u0", name: "Root Admin", email: "root@zan.test" },
}
const ACTIVITY = "/api/admin/operations/activity-logs"

let fetchMock: FetchMock
let rows: object[]
let restoreFormData: () => void

function routes(extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: ME }) },
        { path: "/api/auth/profile", reply: () => respond(200, { success: true, data: PROFILE }) },
        {
            path: `${ACTIVITY}?page=1&limit=15&userId=u1`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: rows,
                    pagination: { page: 1, limit: 15, total: rows.length, pages: 1 },
                    scope: "self",
                }),
        },
    ]
}

async function openProfile(extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "More"))
    await press(findPressable(renderer, "Profile"))
    return renderer
}

async function openEdit(extra: FetchRoute[] = []) {
    const renderer = await openProfile(extra)
    await press(findPressableByText(renderer, "Edit profile"))
    return renderer
}

function getInput(renderer: Awaited<ReturnType<typeof renderApp>>, label: string) {
    return renderer.root.find(
        (node) => node.props.accessibilityLabel === label && typeof node.props.onChangeText === "function",
    )
}

beforeAll(() => {
    restoreFormData = installRecordingFormData()
})

afterAll(() => restoreFormData())

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    rows = [
        {
            _id: "a1",
            entityType: 0,
            entityId: "l1",
            entityName: "Acme",
            action: "CREATE",
            oldData: null,
            newData: {},
            user: null,
            createdAt: "2026-10-01T08:00:00Z",
        },
        {
            _id: "a2",
            entityType: 0,
            entityId: "l1",
            entityName: "Acme",
            action: "status",
            oldData: 10,
            newData: 20,
            user: null,
            createdAt: "2026-10-02T08:00:00Z",
        },
    ]
    await clearToken()
    saveActiveRegion(null)
})

describe("profile", () => {
    it("shows the card, the facts with dayjs dates, Created by, and my activity", async () => {
        const renderer = await openProfile()
        const texts = getTexts(renderer)

        expect(getCalls(fetchMock)).toEqual(
            expect.arrayContaining(["GET /api/auth/profile", `GET ${ACTIVITY}?page=1&limit=15&userId=u1`]),
        )
        const expected = [
            "Asha Rao",
            "asha@zan.test",
            "Admin",
            "Active",
            "Member since",
            "1 Sep 2026, 3:07 PM",
            "—",
            "2 Oct 2026, 9:30 AM",
            "Created by",
            "Root Admin",
            "My activity",
            "Created",
            "Lead",
            "— Acme",
            "Updated Status",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        await unmountApp(renderer)
    })

    it("says Nothing yet. with no activity", async () => {
        rows = []
        const renderer = await openProfile()
        expect(getTexts(renderer)).toContain("Nothing yet.")
        await unmountApp(renderer)
    })

    it("opens Profile from the header avatar menu", async () => {
        await saveToken("jwt-1")
        routeFetch(fetchMock, routes([]))
        const renderer = await renderApp()

        await press(
            renderer.root.findAll(
                (node) => node.props.accessibilityLabel === "Profile menu" && typeof node.props.onPress === "function",
            )[0],
        )
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Signed in", "Asha Rao", "Edit profile", "Logout"]))
        await press(findPressableByText(renderer, "Profile"))
        expect(renderer.root.findAllByType(ProfileScreen)).toHaveLength(1)
        await unmountApp(renderer)
    })
})

describe("edit profile", () => {
    it("checks the password fields in the web's order and words", async () => {
        const error = jest.spyOn(notify, "error")
        const renderer = await openEdit()

        await press(findPressableByText(renderer, "Update password"))
        expect(error).toHaveBeenLastCalledWith("Please fill in all password fields")
        await typeInto(renderer, "Current password", "old-secret")
        await typeInto(renderer, "New password", "short")
        await press(findPressableByText(renderer, "Update password"))
        expect(error).toHaveBeenLastCalledWith("New password must be at least 6 characters")
        await typeInto(renderer, "New password", "longer1")
        await typeInto(renderer, "Confirm new password", "longer2")
        await press(findPressableByText(renderer, "Update password"))
        expect(error).toHaveBeenLastCalledWith("New password and confirmation do not match")
        expect(getCalls(fetchMock).filter((call) => call.startsWith("PATCH"))).toEqual([])
        await unmountApp(renderer)
    })

    it("updates the password and goes back, and a wrong one keeps the session", async () => {
        const success = jest.spyOn(notify, "success")
        const error = jest.spyOn(notify, "error")
        const bodies: unknown[] = []
        let isWrong = true
        const renderer = await openEdit([
            {
                method: "PATCH",
                path: "/api/auth/profile/password",
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return isWrong
                        ? respond(401, { success: false, message: "Old password is incorrect" })
                        : respond(200, { success: true, message: "Password updated successfully" })
                },
            },
        ])

        await typeInto(renderer, "Current password", "wrong")
        await typeInto(renderer, "New password", "longer1")
        await typeInto(renderer, "Confirm new password", "longer1")
        await press(findPressableByText(renderer, "Update password"))
        expect(error).toHaveBeenLastCalledWith("Old password is incorrect")
        expect(getToken()).toBe("jwt-1")
        expect(renderer.root.findAllByType(ProfileEditScreen)).toHaveLength(1)

        isWrong = false
        await typeInto(renderer, "Current password", "old-secret")
        await press(findPressableByText(renderer, "Update password"))
        expect(bodies.at(-1)).toEqual({ oldPassword: "old-secret", newPassword: "longer1" })
        expect(success).toHaveBeenCalledWith("Password updated successfully")
        expect(renderer.root.findAllByType(ProfileEditScreen)).toHaveLength(0)
        await unmountApp(renderer)
    })

    it("shows and hides each password field on its own", async () => {
        const renderer = await openEdit()

        await press(findPressable(renderer, "Show new password"))
        expect(getInput(renderer, "New password").props.secureTextEntry).toBe(false)
        expect(getInput(renderer, "Current password").props.secureTextEntry).toBe(true)
        expect(getInput(renderer, "Confirm new password").props.secureTextEntry).toBe(true)
        await press(findPressable(renderer, "Hide new password"))
        expect(getInput(renderer, "New password").props.secureTextEntry).toBe(true)
        await unmountApp(renderer)
    })

    it("uploads a photo from the gallery and refreshes the signed-in user", async () => {
        const success = jest.spyOn(notify, "success")
        let parts: FormPart[] = []
        ;(launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: "file:///photos/me.png", fileName: "me.png", type: "image/png", fileSize: 200_000 }],
        })
        const renderer = await openEdit([
            {
                method: "POST",
                path: "/api/auth/profile/avatar",
                reply: (init) => {
                    parts = (init.body as unknown as { getParts: () => FormPart[] }).getParts()
                    return respond(200, {
                        success: true,
                        message: "Avatar updated successfully",
                        data: { avatar: "https://ik/me.png" },
                    })
                },
            },
        ])
        const meCalls = getCalls(fetchMock).filter((call) => call === "GET /api/auth/me").length

        await press(findPressableByText(renderer, "Change photo"))
        await press(findPressableByText(renderer, "Choose from gallery"))
        expect(parts).toEqual([
            { fieldName: "avatarFile", uri: "file:///photos/me.png", name: "me.png", type: "image/png" },
        ])
        expect(getCalls(fetchMock).filter((call) => call === "GET /api/auth/me").length).toBe(meCalls + 1)
        expect(success).toHaveBeenCalledWith("Avatar updated successfully")
        await unmountApp(renderer)
    })

    it("refuses a large photo from the camera and a GIF, with no request", async () => {
        const error = jest.spyOn(notify, "error")
        const renderer = await openEdit()

        ;(launchCamera as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: "file:///cam.jpg", fileName: "cam.jpg", type: "image/jpeg", fileSize: 6 * 1024 * 1024 }],
        })
        await press(findPressableByText(renderer, "Change photo"))
        await press(findPressableByText(renderer, "Camera"))
        expect(error).toHaveBeenLastCalledWith("File too large (max 5MB)")
        ;(launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: "file:///a.gif", fileName: "a.gif", type: "image/gif", fileSize: 100 }],
        })
        await press(findPressableByText(renderer, "Change photo"))
        await press(findPressableByText(renderer, "Choose from gallery"))
        expect(error).toHaveBeenLastCalledWith("Invalid file type (JPEG or PNG only)")
        expect(getCalls(fetchMock).filter((call) => call.startsWith("POST"))).toEqual([])
        await unmountApp(renderer)
    })
})
