import * as Sentry from "@sentry/react-native"
import type { ErrorEvent } from "@sentry/react-native"

import { SENTRY_DSN, initSentry, scrubBreadcrumb, scrubEvent } from "@/lib/sentry"

describe("scrubEvent", () => {
    it("removes the Authorization header and any token, at any depth", () => {
        const event: ErrorEvent = {
            type: undefined,
            message: "boom",
            request: {
                url: "https://api.zan.test/api/auth/me",
                headers: { Authorization: "Bearer jwt-1", "X-Active-Region": "IN" },
                data: { email: "asha@zan.test", password: "secret" },
            },
            extra: { session: { token: "jwt-1", nested: [{ accessToken: "a" }] }, screen: "LeadSources" },
            contexts: { auth: { jwt: "jwt-1" } },
            breadcrumbs: [{ category: "fetch", data: { url: "/api/x", token: "jwt-1" } }],
        }

        const scrubbed = scrubEvent(event)

        expect(scrubbed.request?.headers).toEqual({ Authorization: "[redacted]", "X-Active-Region": "IN" })
        expect(scrubbed.request?.data).toEqual({ email: "asha@zan.test", password: "[redacted]" })
        expect(scrubbed.extra).toEqual({
            session: { token: "[redacted]", nested: [{ accessToken: "[redacted]" }] },
            screen: "LeadSources",
        })
        expect(scrubbed.contexts).toEqual({ auth: { jwt: "[redacted]" } })
        expect(scrubbed.breadcrumbs?.[0].data).toEqual({ url: "/api/x", token: "[redacted]" })
        expect(JSON.stringify(scrubbed)).not.toContain("jwt-1")
        // The original event is left as it was.
        expect(event.request?.headers?.Authorization).toBe("Bearer jwt-1")
    })

    it("leaves a breadcrumb without data alone", () => {
        const breadcrumb = { category: "navigation", message: "LeadSources" }
        expect(scrubBreadcrumb(breadcrumb)).toBe(breadcrumb)
    })
})

describe("initSentry", () => {
    it("sends nothing while the DSN is empty", () => {
        expect(SENTRY_DSN).toBe("")
        initSentry()
        expect(Sentry.init).not.toHaveBeenCalled()
    })
})
