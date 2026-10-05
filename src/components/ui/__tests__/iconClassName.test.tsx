import { colorScheme } from "nativewind"
import ReactTestRenderer from "react-test-renderer"

import AccessDenied from "@/components/ui/AccessDenied"
import NotificationBadge from "@/components/ui/NotificationBadge"

import { injectAppStylesheet } from "../../../../jest/tailwindStyles"

// Tailwind 3.4 colours of the classes under test.
const INDIGO_600 = "#4f46e5"
const INDIGO_400 = "#818cf8"
const AMBER_600 = "#d97706"
const AMBER_400 = "#fbbf24"

function getStrokes(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root
        .findAll((node) => typeof node.props.stroke === "string" && node.props.stroke.startsWith("#"))
        .map((node) => node.props.stroke.toLowerCase())
}

async function setScheme(scheme: "light" | "dark") {
    await ReactTestRenderer.act(async () => {
        colorScheme.set(scheme)
    })
}

async function renderTree(element: React.ReactElement) {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(element)
    })
    return renderer!
}

beforeAll(async () => {
    await injectAppStylesheet()
})

afterEach(async () => {
    await setScheme("light")
})

test("a notification badge icon takes the web's colour class, light and dark", async () => {
    await setScheme("light")
    expect(getStrokes(await renderTree(<NotificationBadge badge="target" />))).toContain(INDIGO_600)

    await setScheme("dark")
    expect(getStrokes(await renderTree(<NotificationBadge badge="🎯" />))).toContain(INDIGO_400)
})

test("a mounted icon recolours when the colour scheme changes, with no remount", async () => {
    await setScheme("light")
    const renderer = await renderTree(<NotificationBadge badge="target" />)
    expect(getStrokes(renderer)).toContain(INDIGO_600)

    await setScheme("dark")
    expect(getStrokes(renderer)).toContain(INDIGO_400)
    expect(getStrokes(renderer)).not.toContain(INDIGO_600)
})

test("the AccessDenied shield is amber-600 in light mode and amber-400 in dark mode", async () => {
    await setScheme("light")
    expect(getStrokes(await renderTree(<AccessDenied />))).toContain(AMBER_600)

    await setScheme("dark")
    expect(getStrokes(await renderTree(<AccessDenied />))).toContain(AMBER_400)
})
