import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import SheetData from "@/components/leadSources/SheetData"

function render(data: Record<string, string>): string[] {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<SheetData data={data} />)
    })
    return renderer!.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children)
            ? children.filter((child) => typeof child === "string").join("")
            : String(children)
    })
}

describe("SheetData", () => {
    it("labels known columns in the config's order, shows dates as 3 Apr 2021, and puts extra columns last", () => {
        const texts = render({
            website_url: "acme.test",
            city: "Pune",
            create_date: "2021-04-03",
            name: "",
            zip: "411001",
        })
        expect(texts).toEqual([
            "Domain created",
            "3 Apr 2021",
            "City",
            "Pune",
            "ZIP",
            "411001",
            "Website url",
            " (extra column)",
            "acme.test",
        ])
    })

    it("says so when the row had nothing else", () => {
        expect(render({ name: "" })).toEqual(["The sheet row had no other values."])
    })
})
