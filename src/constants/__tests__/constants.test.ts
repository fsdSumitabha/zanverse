import { invert } from "@/constants/_invert"
import { CALL_DIRECTION_META, CALL_STATUS_META } from "@/constants/callStatus"
import { CLIENT_STATUS, CLIENT_STATUS_META } from "@/constants/clientStatus"
import { ENTITY_TYPE, ENTITY_TYPE_META } from "@/constants/entityTypes"
import { EVENT_CODE, EVENT_TYPE, type EventName } from "@/constants/eventTypes"
import { INTERACTION_TYPE, INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { canConvertLeadSources, canManageLeadSources, canUseLeadSources } from "@/constants/leadSourceRoles"
import {
    LEAD_SOURCE_CLOSED_STATUSES,
    LEAD_SOURCE_OPEN_STATUSES,
    LEAD_SOURCE_PICKABLE_STATUSES,
    LEAD_SOURCE_STATUS,
    LEAD_SOURCE_STATUSES,
    LEAD_SOURCE_STATUS_META,
    UPLOAD_ROW_RESULT_META,
    isLeadSourceStatus,
} from "@/constants/leadSourceStatus"
import { LEAD_STATUS, LEAD_STATUS_META } from "@/constants/leadStatus"
import { MEETING_STATUS, MEETING_STATUS_META } from "@/constants/meetingStatus"
import { NOTIFICATION_CHANNEL } from "@/constants/notificationChannels"
import { NOTIFICATION_RULES } from "@/constants/notificationRules"
import { PROJECT_STATUS } from "@/constants/projectStatus"
import { SERVICE_META, Service } from "@/constants/services"
import { STATUS_META_BY_ENTITY } from "@/constants/statusMetaByEntity"
import { USER_ROLE_META, canAdministerAllRegions } from "@/constants/userRoles"

describe("lead source status", () => {
    test("60 was retired: it has no meta, so a renderer must fall back to Unknown and grey", () => {
        const meta: Record<number, unknown> = LEAD_SOURCE_STATUS_META
        expect(meta[60]).toBeUndefined()
        expect(STATUS_META_BY_ENTITY[ENTITY_TYPE.LEAD_SOURCE]?.[60]).toBeUndefined()
        expect(isLeadSourceStatus(60)).toBe(false)
        expect(LEAD_SOURCE_STATUSES).not.toContain(60)
    })

    test("the codes are 10, 20, 30, 40, 50 and 70", () => {
        expect(LEAD_SOURCE_STATUSES).toEqual([10, 20, 30, 40, 50, 70])
        expect(Object.keys(LEAD_SOURCE_STATUS_META).map(Number)).toEqual(LEAD_SOURCE_STATUSES)
    })

    test("open and closed lists are derived from the `closed` flag", () => {
        for (const status of LEAD_SOURCE_STATUSES) {
            const isClosed = LEAD_SOURCE_STATUS_META[status].closed
            expect(LEAD_SOURCE_CLOSED_STATUSES.includes(status)).toBe(isClosed)
            expect(LEAD_SOURCE_OPEN_STATUSES.includes(status)).toBe(!isClosed)
        }
        expect(LEAD_SOURCE_OPEN_STATUSES).toEqual([10, 20, 30, 40])
        expect(LEAD_SOURCE_CLOSED_STATUSES).toEqual([50, 70])
    })

    test("Converted cannot be picked; only the convert route sets it", () => {
        expect(LEAD_SOURCE_PICKABLE_STATUSES).toEqual([10, 20, 30, 40, 50])
        expect(LEAD_SOURCE_PICKABLE_STATUSES).not.toContain(LEAD_SOURCE_STATUS.CONVERTED)
    })

    test("Tailwind strings are kept verbatim for NativeWind", () => {
        expect(LEAD_SOURCE_STATUS_META[40].color).toBe("bg-emerald-600 text-white")
        expect(UPLOAD_ROW_RESULT_META[10].chip).toBe(
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
        )
        expect(UPLOAD_ROW_RESULT_META[30].excelFill).toBe("#FDE2E2")
    })
})

describe("events", () => {
    test("EVENT_CODE and EVENT_TYPE round-trip, with numeric codes", () => {
        const entries = Object.entries(EVENT_TYPE)
        expect(entries.length).toBeGreaterThan(0)
        for (const [code, name] of entries) {
            expect(EVENT_CODE[name]).toBe(Number(code))
            expect(EVENT_TYPE[EVENT_CODE[name]]).toBe(name)
        }
    })

    test("every interaction code is also an event, named after its key", () => {
        for (const [name, code] of Object.entries(INTERACTION_TYPE)) {
            expect(EVENT_TYPE[code]).toBe(name)
            expect(EVENT_CODE[name as EventName]).toBe(code)
        }
        expect(EVENT_CODE.CALL_MADE).toBe(2210)
        expect(EVENT_CODE.LEAD_CREATED).toBe(1000)
    })

    test("invert swaps keys and values", () => {
        expect(invert({ A: 1, B: "b" })).toEqual({ 1: "A", b: "B" })
    })

    test("notification rules reference real events and roles", () => {
        for (const [event, roles] of Object.entries(NOTIFICATION_RULES)) {
            expect(Number(event) in EVENT_TYPE).toBe(true)
            for (const role of roles ?? []) expect(role in USER_ROLE_META).toBe(true)
        }
        expect(NOTIFICATION_RULES[2410]).toEqual([10, 30, 45, 60, 70])
    })
})

describe("codes that never change", () => {
    test("meeting statuses share the meeting interaction codes on purpose", () => {
        expect(MEETING_STATUS).toEqual({
            SCHEDULED: INTERACTION_TYPE.MEETING_SCHEDULED,
            RESCHEDULED: INTERACTION_TYPE.MEETING_RESCHEDULED,
            CANCELLED: INTERACTION_TYPE.MEETING_CANCELLED,
            MISSED: INTERACTION_TYPE.MEETING_MISSED,
            COMPLETED: INTERACTION_TYPE.MEETING_COMPLETED,
        })
        expect(Object.values(MEETING_STATUS)).toEqual([2010, 2020, 2030, 2040, 2050])
        expect(MEETING_STATUS_META[2010].label).toBe(INTERACTION_TYPE_META[2010].label)
    })

    test("client status is the 1-4 exception", () => {
        expect(Object.values(CLIENT_STATUS)).toEqual([1, 2, 3, 4])
        expect(CLIENT_STATUS_META[3].label).toBe("On Hold")
    })

    test("lead, project and entity codes", () => {
        expect(Object.values(LEAD_STATUS)).toEqual([10, 20, 30, 40, 50, 60, 70])
        expect(Object.values(PROJECT_STATUS)).toEqual([110, 120, 130, 140, 150, 160, 170, 180])
        expect(Object.values(ENTITY_TYPE)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        expect(ENTITY_TYPE_META[ENTITY_TYPE.LEAD_SOURCE_UPLOAD].label).toBe("Lead Source Upload")
        expect(Service.SEO).toBe(50)
        expect(SERVICE_META[Service.WEB_DEVELOPMENT].label).toBe("Web Dev")
    })
})

describe("labels match the web exactly", () => {
    test("lead status labels", () => {
        expect(LEAD_STATUS_META[10].label).toBe("New Lead")
        expect(LEAD_STATUS_META[30].label).toBe("Meeting Scheduled")
    })

    test("user role labels", () => {
        expect(USER_ROLE_META[60].label).toBe("Business Development Executive")
        expect(USER_ROLE_META[65].label).toBe("US Sales Agent")
        expect(USER_ROLE_META[69].label).toBe("US Leads Manager")
    })
})

describe("role rules", () => {
    test("lead source roles: 65 can work sources but not convert them", () => {
        expect(canUseLeadSources(65)).toBe(true)
        expect(canConvertLeadSources(65)).toBe(false)
        expect(canManageLeadSources(69)).toBe(true)
        expect(canManageLeadSources(60)).toBe(false)
        expect(canUseLeadSources(null)).toBe(false)
        expect(canUseLeadSources(undefined)).toBe(false)
    })

    test("only Admin and HR administer staff in every region", () => {
        expect(canAdministerAllRegions(10)).toBe(true)
        expect(canAdministerAllRegions(20)).toBe(true)
        expect(canAdministerAllRegions(60)).toBe(false)
    })
})

describe("RN edits", () => {
    test("callStatus keeps the lucide icon names as plain strings, with no runtime import", () => {
        expect(CALL_DIRECTION_META[0]).toEqual({ label: "Outbound", icon: "PhoneOutgoing" })
        expect(CALL_DIRECTION_META[1]).toEqual({ label: "Inbound", icon: "PhoneIncoming" })
        expect(Object.keys(CALL_STATUS_META).map(Number)).toEqual([0, 1, 2, 3])
    })

    test("notification channels are data only: codes 2, 3, 4 with labels and no dispatch functions", () => {
        expect(NOTIFICATION_CHANNEL).toEqual({
            2: { label: "Email" },
            3: { label: "SMS" },
            4: { label: "Web Push" },
        })
    })

    test("the status meta map covers the entities with a status, and only those", () => {
        const withMeta = Object.keys(STATUS_META_BY_ENTITY)
            .map(Number)
            .sort((a, b) => a - b)
        expect(withMeta).toEqual([
            ENTITY_TYPE.LEAD,
            ENTITY_TYPE.CLIENT,
            ENTITY_TYPE.PROJECT,
            ENTITY_TYPE.MEETING,
            ENTITY_TYPE.CALL,
            ENTITY_TYPE.LEAD_SOURCE,
        ])
    })
})
