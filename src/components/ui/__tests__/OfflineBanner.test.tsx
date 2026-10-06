import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import OfflineBanner from "@/components/ui/OfflineBanner"

import { setNetwork } from "../../../../jest/appHarness"

async function renderBanner(): Promise<ReactTestRenderer.ReactTestRenderer> {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<OfflineBanner />)
    })
    return renderer!
}

function getTexts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => String(node.props.children))
}

beforeEach(() => jest.clearAllMocks())

describe("OfflineBanner", () => {
    it("hides while the state is still unknown, and shows once the phone is offline", async () => {
        const renderer = await renderBanner()
        expect(getTexts(renderer)).toEqual([])
        await setNetwork(null)
        expect(getTexts(renderer)).toEqual([])
        await setNetwork(false)
        expect(getTexts(renderer)).toEqual(["You are offline"])
        await ReactTestRenderer.act(async () => renderer.unmount())
    })

    it("counts a network with no internet as offline, and hides again when it is back", async () => {
        const renderer = await renderBanner()
        await setNetwork(true, false)
        expect(getTexts(renderer)).toEqual(["You are offline"])
        await setNetwork(true, true)
        expect(getTexts(renderer)).toEqual([])
        await ReactTestRenderer.act(async () => renderer.unmount())
    })
})
