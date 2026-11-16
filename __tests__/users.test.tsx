import { Text } from "react-native"
import { launchImageLibrary } from "react-native-image-picker"
import ReactTestRenderer from "react-test-renderer"

import { navigationRef } from "@/api/navigationRef"
import Fab from "@/components/ui/Fab"
import { notify } from "@/lib/notify"
import { clearToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
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

const ADMIN = {
    id: "u1",
    name: "Asha Rao",
    email: "asha@zan.test",
    role: 10,
    regions: ["IN", "US"],
    activeRegion: "ALL",
}
const US_MANAGER = { id: "u7", name: "Sam Lee", email: "sam@zan.test", role: 69, regions: ["US"], activeRegion: "US" }
const USERS = "/api/admin/operations/users"

const MEERA = {
    _id: "u9",
    name: "Meera Shah",
    email: "meera@zan.test",
    role: 60,
    regions: ["IN"],
    isActive: true,
    avatar: "",
    createdAt: "2026-09-01T10:00:00Z",
    createdBy: { _id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10 },
}
const OLD = { ...MEERA, _id: "u8", name: "Old Account", email: "old@zan.test", isActive: false, regions: [] }

let fetchMock: FetchMock
let restoreFormData: () => void

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/users\?page=1/,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [MEERA, OLD],
                    pagination: { page: 1, limit: 10, total: 2, pages: 1 },
                }),
        },
        { path: `${USERS}/u9`, reply: () => respond(200, { success: true, data: MEERA }) },
        {
            path: `${USERS}/u1`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: { ...MEERA, _id: "u1", name: "Asha Rao", role: 10, regions: ["IN", "US"] },
                }),
        },
    ]
}

async function openUsers(user: object = ADMIN, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Users"))
    return renderer
}

function getParts(body: unknown): [string, FormPart][] {
    return (body as { getParts: () => FormPart[] }).getParts().map((part) => [part.fieldName, part])
}

/** The last pressable holding this text: the confirm dialog's button, not the form's button with the same words. */
function findLastPressableByText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    const matches = renderer.root.findAllByType(Text).filter((node) => node.props.children === text)
    for (const textNode of matches.reverse()) {
        let node = textNode.parent
        while (node && typeof node.props.onPress !== "function") node = node.parent
        if (node) return node
    }
    throw new Error(`No pressable holds the text "${text}"`)
}

async function fillCreateForm(renderer: ReactTestRenderer.ReactTestRenderer) {
    await typeInto(renderer, "Name", "Ravi Kumar")
    await typeInto(renderer, "Email", "ravi@zan.test")
    await typeInto(renderer, "Password", "secret1")
}

beforeAll(() => {
    restoreFormData = installRecordingFormData()
})

afterAll(() => restoreFormData())

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    saveActiveRegion(null)
})

describe("users list", () => {
    it("lists users with status, role, regions and login, and the create entry points", async () => {
        const renderer = await openUsers()
        const texts = getTexts(renderer)

        expect(getCalls(fetchMock)).toContain(`GET ${USERS}?page=1&limit=10`)
        const expected = [
            "2 users found",
            "Meera Shah",
            "Active",
            "Old Account",
            "Inactive",
            "Disabled",
            "No region",
            "No login yet",
            "Created by Asha Rao",
            "Create New User",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        expect(findPressable(renderer, "Edit Meera Shah")).toBeTruthy()
        // The header button's text is in `expected`; the floating button sits over the list.
        expect(renderer.root.findAllByType(Fab)).toHaveLength(1)
        await unmountApp(renderer)
    })

    it("shows a role-69 account no edit pencil, and AccessDenied on the edit screen", async () => {
        const renderer = await openUsers(US_MANAGER)
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Edit Meera Shah")).toHaveLength(0)

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", { screen: "UsersTab", params: { screen: "UserEdit", params: { id: "u9" } } })
        })
        await flush()
        expect(getTexts(renderer)).toContain("Access Denied")
        await unmountApp(renderer)
    })
})

describe("create user", () => {
    it("creates after the confirm with the form and the avatar, and toasts the new name", async () => {
        const success = jest.spyOn(notify, "success")
        let parts: [string, FormPart][] = []
        ;(launchImageLibrary as jest.Mock).mockResolvedValue({
            assets: [{ uri: "file:///photos/me.jpg", fileName: "me.jpg", type: "image/jpeg", fileSize: 120_000 }],
        })
        const renderer = await openUsers(ADMIN, [
            {
                method: "POST",
                path: USERS,
                reply: (init) => {
                    parts = getParts(init.body)
                    return respond(201, { success: true, data: { name: "Ravi Kumar", email: "ravi@zan.test" } })
                },
            },
        ])

        await press(findPressableByText(renderer, "Create New User"))
        await fillCreateForm(renderer)
        await press(findPressable(renderer, "Regions: Select regions"))
        await press(findPressableByText(renderer, "India"))
        await press(findPressableByText(renderer, "Done"))
        await press(findPressableByText(renderer, "Choose image"))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["me.jpg", "117.2 KB"]))

        await press(findPressableByText(renderer, "Create User"))
        expect(getTexts(renderer)).toContain("The password is emailed to them.")
        await press(findLastPressableByText(renderer, "Create User"))

        expect(parts.map(([name]) => name)).toEqual([
            "name",
            "email",
            "password",
            "role",
            "regions",
            "isActive",
            "avatarFile",
        ])
        expect(parts.find(([name]) => name === "regions")?.[1].string).toBe("IN")
        expect(parts.find(([name]) => name === "avatarFile")?.[1]).toMatchObject({
            uri: "file:///photos/me.jpg",
            type: "image/jpeg",
        })
        expect(success).toHaveBeenCalledWith(
            "Ravi Kumar has been created",
            expect.objectContaining({ description: "ravi@zan.test" }),
        )
        expect(getTexts(renderer)).toContain("2 users found")
        await unmountApp(renderer)
    })

    it("refuses an empty region set, and shows a duplicate email on the field", async () => {
        const renderer = await openUsers(ADMIN, [
            {
                method: "POST",
                path: USERS,
                reply: () => respond(409, { success: false, message: "Email already exists" }),
            },
        ])

        await press(findPressableByText(renderer, "Create New User"))
        await fillCreateForm(renderer)
        await press(findPressableByText(renderer, "Create User"))
        expect(getTexts(renderer)).toContain("Pick at least one region")
        expect(getTexts(renderer)).not.toContain("The password is emailed to them.")

        await press(findPressable(renderer, "Regions: Select regions"))
        await press(findPressableByText(renderer, "United States"))
        await press(findPressableByText(renderer, "Done"))
        await press(findPressableByText(renderer, "Create User"))
        await press(findLastPressableByText(renderer, "Create User"))
        expect(getTexts(renderer)).toContain("Email already exists")
        await unmountApp(renderer)
    })

    it("refuses a large or a GIF image in the app", async () => {
        const renderer = await openUsers()
        await press(findPressableByText(renderer, "Create New User"))
        ;(launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: "file:///big.jpg", fileName: "big.jpg", type: "image/jpeg", fileSize: 6 * 1024 * 1024 }],
        })
        await press(findPressableByText(renderer, "Choose image"))
        expect(getTexts(renderer)).toContain("File too large (max 5MB)")
        ;(launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: "file:///a.gif", fileName: "a.gif", type: "image/gif", fileSize: 1000 }],
        })
        await press(findPressableByText(renderer, "Choose image"))
        expect(getTexts(renderer)).toContain("Invalid file type")
        await unmountApp(renderer)
    })

    it("lets a single-region manager grant only their own region, preselected", async () => {
        const renderer = await openUsers(US_MANAGER)
        await press(findPressableByText(renderer, "Create New User"))

        expect(getTexts(renderer)).toContain("You cover United States only, so that is the one region you can grant.")
        await press(findPressable(renderer, "Regions: US"))
        // IN and AE cannot be granted; US is ticked.
        const boxes = renderer.root.findAll(
            (node) => node.props.accessibilityRole === "checkbox" && typeof node.props.onPress === "function",
        )
        expect(boxes.map((box) => box.props.accessibilityState)).toEqual([
            { checked: false, disabled: true },
            { checked: true, disabled: false },
            { checked: false, disabled: true },
        ])
        await unmountApp(renderer)
    })
})

describe("edit user", () => {
    it("says Nothing changed yet and sends nothing when nothing changed", async () => {
        const info = jest.spyOn(notify, "info")
        const renderer = await openUsers()

        await press(findPressable(renderer, "Edit Meera Shah"))
        await press(findPressableByText(renderer, "Save changes"))
        expect(info).toHaveBeenCalledWith("Nothing changed yet")
        expect(getCalls(fetchMock).filter((call) => call.startsWith("PATCH"))).toEqual([])
        await unmountApp(renderer)
    })

    it("locks your own regions and sends only the changed name", async () => {
        let parts: [string, FormPart][] = []
        const renderer = await openUsers(ADMIN, [
            {
                method: "PATCH",
                path: `${USERS}/u1`,
                reply: (init) => {
                    parts = getParts(init.body)
                    return respond(200, {
                        success: true,
                        data: { ...MEERA, _id: "u1", name: "Asha R", email: "asha@zan.test" },
                    })
                },
            },
        ])

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", { screen: "UsersTab", params: { screen: "UserEdit", params: { id: "u1" } } })
        })
        await flush()
        expect(getTexts(renderer)).toContain("You cannot change your own regions. Ask another admin.")

        await typeInto(renderer, "Name", "Asha R")
        await press(findPressableByText(renderer, "Save changes"))
        expect(parts.map(([name]) => name)).toEqual(["name"])
        await unmountApp(renderer)
    })

    it("shows the could-not-load card with a working Back to users", async () => {
        const renderer = await openUsers(ADMIN, [
            { path: `${USERS}/missing`, reply: () => respond(404, { success: false, message: "User not found" }) },
        ])

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "UsersTab",
                params: { screen: "UserEdit", params: { id: "missing" } },
            })
        })
        await flush()
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["This user could not be loaded", "User not found"]))
        await press(findPressableByText(renderer, "Back to users"))
        expect(getTexts(renderer)).toContain("2 users found")
        await unmountApp(renderer)
    })
})
