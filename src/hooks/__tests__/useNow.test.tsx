import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { useNow } from "@/hooks/useNow"

const START = new Date(2026, 8, 24, 10, 0, 0)

function NowProbe({ intervalMs }: { intervalMs?: number }) {
    const now = useNow(intervalMs)
    return <Text>{String(now)}</Text>
}

function readNow(renderer: ReactTestRenderer.ReactTestRenderer): number {
    return Number(renderer.root.findByType(Text).props.children)
}

beforeEach(() => {
    jest.useFakeTimers({ now: START })
})

afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
})

test("starts at the current time, ticks every interval, and clears its interval on unmount", async () => {
    const setIntervalSpy = jest.spyOn(globalThis, "setInterval")
    const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval")
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<NowProbe intervalMs={1000} />)
    })
    expect(readNow(renderer!)).toBe(START.getTime())

    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(1000)
    })
    expect(readNow(renderer!)).toBe(START.getTime() + 1000)

    const callIndex = setIntervalSpy.mock.calls.findIndex((call) => call[1] === 1000)
    const timer = setIntervalSpy.mock.results[callIndex].value
    await ReactTestRenderer.act(async () => {
        renderer!.unmount()
    })
    expect(clearIntervalSpy).toHaveBeenCalledWith(timer)
})

test("defaults to every 20 seconds", async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<NowProbe />)
    })

    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(19_999)
    })
    expect(readNow(renderer!)).toBe(START.getTime())

    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(1)
    })
    expect(readNow(renderer!)).toBe(START.getTime() + 20_000)

    await ReactTestRenderer.act(async () => {
        renderer!.unmount()
    })
})
