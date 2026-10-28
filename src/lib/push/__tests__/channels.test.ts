import type * as Channels from "@/lib/push/channels"

interface NotifyKitMock {
    default: Record<string, jest.Mock>
    createdChannels: Map<string, Record<string, unknown>>
    createdChannelGroups: Map<string, Record<string, unknown>>
}

// channels.ts remembers what it created per app start, so each test loads it fresh, with a fresh stand-in.
function load(): { channels: typeof Channels; kit: NotifyKitMock } {
    jest.resetModules()
    return { channels: require("@/lib/push/channels"), kit: jest.requireMock("react-native-notify-kit") }
}

describe("getChannelsForRole", () => {
    const { channels } = load()
    const idsFor = (role: number | null) =>
        channels.getChannelsForRole(role).map((code) => require("@/constants/pushChannels").PUSH_CHANNEL_META[code].id)

    it("gives an admin every channel, in the order Settings lists them", () => {
        expect(idsFor(10)).toEqual([
            "callbacks",
            "meetings",
            "new_leads",
            "new_records",
            "quotations",
            "stage_changes",
            "notes",
            "logged_calls",
            "documents",
            "general",
        ])
    })

    it("gives a US Sales Agent only reminders and General, and an accountant quotations too", () => {
        expect(idsFor(65)).toEqual(["callbacks", "general"])
        expect(idsFor(70)).toEqual(["callbacks", "quotations", "general"])
    })

    it("leaves out reminders for a role that never works lead sources, and gives a signed-out phone General", () => {
        expect(idsFor(30)).not.toContain("callbacks")
        expect(idsFor(30)).toContain("new_leads")
        expect(idsFor(null)).toEqual(["general"])
    })
})

describe("resolveChannel", () => {
    it("reads the push's channel code, and sends anything else to General", () => {
        const { channels } = load()
        expect(channels.resolveChannel("30")).toBe(30)
        expect(channels.resolveChannel("999")).toBe(100)
        expect(channels.resolveChannel(undefined)).toBe(100)
    })
})

describe("ensureChannels", () => {
    it("creates the role's channels in their groups at the agreed levels, and deletes the old crm channel", async () => {
        const { channels, kit } = load()
        await channels.ensureChannels(10)

        expect(kit.default.deleteChannel).toHaveBeenCalledWith("crm")
        expect([...kit.createdChannelGroups.keys()].sort()).toEqual(["calls", "pipeline", "team"])
        expect(kit.createdChannels.get("new_leads")).toEqual(
            expect.objectContaining({ name: "New leads", importance: 4, groupId: "pipeline", visibility: 1 }),
        )
        expect(kit.createdChannels.get("new_records")).toEqual(expect.objectContaining({ importance: 4 }))
        for (const id of ["meetings", "quotations", "stage_changes", "notes", "logged_calls", "documents"]) {
            expect(kit.createdChannels.get(id)).toEqual(expect.objectContaining({ importance: 3, sound: "default" }))
        }
        expect(kit.createdChannels.get("callbacks")).toEqual(
            expect.objectContaining({ importance: 4, groupId: "calls" }),
        )
        // General has no group, so it carries no groupId key at all: notify-kit rejects an undefined one.
        expect(kit.createdChannels.get("general")).not.toHaveProperty("groupId")
    })

    it("creates each channel once per app start", async () => {
        const { channels, kit } = load()
        await channels.ensureChannels(65)
        await channels.ensureChannel(30)
        await channels.ensureChannel(30)
        expect(kit.default.createChannel).toHaveBeenCalledTimes(3)
        expect(kit.default.deleteChannel).toHaveBeenCalledTimes(1)
    })
})

describe("getChannelStatuses", () => {
    it("reads each channel as the person left it in Settings", async () => {
        const { channels, kit } = load()
        await channels.ensureChannels(10)
        kit.createdChannels.set("quotations", { ...kit.createdChannels.get("quotations"), importance: 2 })
        kit.createdChannels.set("documents", { ...kit.createdChannels.get("documents"), blocked: true })
        kit.createdChannelGroups.set("calls", { ...kit.createdChannelGroups.get("calls"), blocked: true })

        const states = Object.fromEntries((await channels.getChannelStatuses()).map(({ code, state }) => [code, state]))
        expect(states).toEqual({
            10: "off",
            20: "off",
            30: "pops-up",
            40: "pops-up",
            50: "silent",
            60: "sound",
            70: "sound",
            80: "sound",
            90: "off",
            100: "sound",
        })
    })
})
