import * as Sentry from "@sentry/react-native"
import type { Breadcrumb, ErrorEvent } from "@sentry/react-native"

/**
 * The Sentry project's DSN (Settings → Projects → zanverse → Client Keys). A DSN only lets a client send events, so it
 * is not a secret, but it is empty until the project exists. Empty turns Sentry off: nothing is sent.
 */
export const SENTRY_DSN = ""

const TRACES_SAMPLE_RATE = 0.2
const REDACTED = "[redacted]"
// Keys never sent, wherever they appear in an event: the JWT under any name, and passwords.
const SECRET_KEYS = new Set(["authorization", "token", "accesstoken", "refreshtoken", "jwt", "password"])

/** Follows React Navigation, so each event names the screen it happened on. */
export const navigationIntegration = Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: true })

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** A copy of `value` with every secret key replaced by "[redacted]", at any depth. */
export function scrubSecrets<T>(value: T): T {
    if (Array.isArray(value)) return value.map((item) => scrubSecrets(item)) as T
    if (!isRecord(value)) return value
    const copy: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
        copy[key] = SECRET_KEYS.has(key.toLowerCase()) ? REDACTED : scrubSecrets(item)
    }
    return copy as T
}

/** Removes the Authorization header and any token from an event before it leaves the phone. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
    return {
        ...event,
        request: event.request ? scrubSecrets(event.request) : event.request,
        extra: event.extra ? scrubSecrets(event.extra) : event.extra,
        contexts: event.contexts ? scrubSecrets(event.contexts) : event.contexts,
        breadcrumbs: event.breadcrumbs?.map(scrubBreadcrumb),
    }
}

/** The same for one breadcrumb: a fetch breadcrumb's data can carry request details. */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
    return breadcrumb.data ? { ...breadcrumb, data: scrubSecrets(breadcrumb.data) } : breadcrumb
}

/**
 * Starts Sentry before the app renders: crashes and unhandled promise rejections, 20% of navigation traces, no
 * personal data, and the scrubbers above. Does nothing while SENTRY_DSN is empty.
 */
export function initSentry(): void {
    if (!SENTRY_DSN) return
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: TRACES_SAMPLE_RATE,
        sendDefaultPii: false,
        environment: __DEV__ ? "development" : "production",
        integrations: [navigationIntegration],
        beforeSend: scrubEvent,
        beforeBreadcrumb: scrubBreadcrumb,
    })
}

/** Called once the navigation container is ready, so traces and events carry the route. */
export function registerSentryNavigation(navigationRef: unknown): void {
    navigationIntegration.registerNavigationContainer(navigationRef)
}

/** Sends a test error, for the debug-only button in the kitchen sink. */
export function sendSentryTestError(): void {
    Sentry.captureException(new Error("Sentry test error from the kitchen sink"))
}
