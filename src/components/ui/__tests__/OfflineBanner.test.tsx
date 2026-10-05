import { useNetInfo } from "@react-native-community/netinfo"
import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import OfflineBanner from "@/components/ui/OfflineBanner"

const mockedUseNetInfo = useNetInfo as jest.Mock

async function renderBanner(isConnected: boolean | null): Promise<string[]> {
    mockedUseNetInfo.mockReturnValue({ type: "unknown", isConnected, isInternetReachable: null, details: null })
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<OfflineBanner />)
    })
    return renderer!.root.findAllByType(Text).map((node) => String(node.props.children))
}

describe("OfflineBanner", () => {
    it("shows while the phone is offline", async () => {
        expect(await renderBanner(false)).toEqual(["You are offline"])
    })

    it("hides while online, and while the state is still unknown", async () => {
        expect(await renderBanner(true)).toEqual([])
        expect(await renderBanner(null)).toEqual([])
    })
})
