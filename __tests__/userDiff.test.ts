import { getUserFormEntries, type LoadedUser, type UserFormValues } from "@/lib/userDiff"

const LOADED: LoadedUser = {
    _id: "u9",
    name: "Meera Shah",
    email: "Meera@Zan.test",
    role: 60,
    regions: ["IN", "US"],
    isActive: true,
    avatar: "https://ik.imagekit.io/zan/meera.png",
}

function makeForm(overrides: Partial<UserFormValues> = {}): UserFormValues {
    return {
        name: "Meera Shah",
        email: "meera@zan.test",
        password: "",
        role: 60,
        regions: ["IN", "US"],
        isActive: true,
        avatar: LOADED.avatar ?? "",
        avatarFile: null,
        ...overrides,
    }
}

describe("getUserFormEntries in edit mode", () => {
    it("sends nothing when nothing changed, even with spaces and a different email case", () => {
        expect(getUserFormEntries(makeForm({ name: " Meera Shah " }), "edit", LOADED)).toEqual([])
    })

    it("sends no regions for the same set in another order", () => {
        expect(getUserFormEntries(makeForm({ regions: ["US", "IN"] }), "edit", LOADED)).toEqual([])
    })

    it("sends one entry per region when the set changed", () => {
        expect(getUserFormEntries(makeForm({ regions: ["IN", "US", "AE"] }), "edit", LOADED)).toEqual([
            ["regions", "IN"],
            ["regions", "US"],
            ["regions", "AE"],
        ])
    })

    it("sends a password only when typed", () => {
        expect(getUserFormEntries(makeForm({ password: "" }), "edit", LOADED)).toEqual([])
        expect(getUserFormEntries(makeForm({ password: "secret1" }), "edit", LOADED)).toEqual([["password", "secret1"]])
    })

    it("asks to remove a cleared avatar, and sends a new one in its place", () => {
        expect(getUserFormEntries(makeForm({ avatar: "" }), "edit", LOADED)).toEqual([["removeAvatar", "true"]])
        const file = { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg", size: 1000 }
        expect(getUserFormEntries(makeForm({ avatar: "", avatarFile: file }), "edit", LOADED)).toEqual([
            ["avatarFile", file],
        ])
    })

    it("sends the name, role and Active switch when they changed", () => {
        expect(getUserFormEntries(makeForm({ name: "Meera S", role: 65, isActive: false }), "edit", LOADED)).toEqual([
            ["name", "Meera S"],
            ["role", "65"],
            ["isActive", "false"],
        ])
    })
})

describe("getUserFormEntries in create mode", () => {
    it("sends every field and every region", () => {
        const form = makeForm({ password: "secret1", avatar: "" })
        expect(getUserFormEntries(form, "create")).toEqual([
            ["name", "Meera Shah"],
            ["email", "meera@zan.test"],
            ["password", "secret1"],
            ["role", "60"],
            ["regions", "IN"],
            ["regions", "US"],
            ["isActive", "true"],
        ])
    })
})
