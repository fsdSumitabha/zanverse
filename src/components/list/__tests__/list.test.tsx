import { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { Platform, Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import DateField from "@/components/list/DateField"
import ListFilters from "@/components/list/ListFilters"
import ListScreen from "@/components/list/ListScreen"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import type { ListQueryResult } from "@/hooks/useListQuery"
import { clampDate, MIN_DATE, todayLocal } from "@/lib/dates"

jest.useFakeTimers()

jest.mock("@react-native-community/datetimepicker", () => ({
    __esModule: true,
    default: () => null,
    DateTimePickerAndroid: { open: jest.fn() },
}))

interface Row {
    _id: string
    name: string
}

type Renderer = ReactTestRenderer.ReactTestRenderer

function makeQuery(overrides: Partial<ListQueryResult<Row>> = {}): ListQueryResult<Row> {
    return {
        query: { page: 1, search: "", status: "", from: "", to: "", view: "", sort: "", range: "", entityType: "" },
        searchText: "",
        setSearch: jest.fn(),
        setPage: jest.fn(),
        setFilters: jest.fn(),
        resetFilters: jest.fn(),
        items: [],
        setItems: jest.fn(),
        envelope: null,
        total: 0,
        pages: 1,
        loading: false,
        refreshing: false,
        loadingMore: false,
        accessError: null,
        error: null,
        isOffline: false,
        refresh: jest.fn(),
        loadMore: jest.fn(),
        ...overrides,
    }
}

async function render(element: React.ReactElement): Promise<Renderer> {
    let renderer: Renderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(element)
    })
    return renderer!
}

function getTexts(renderer: Renderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

function pressText(renderer: Renderer, text: string) {
    const node = renderer.root.findAllByType(Text).find((candidate) => candidate.props.children === text)
    let target = node?.parent ?? null
    while (target && typeof target.props.onPress !== "function") target = target.parent
    if (!target) throw new Error(`Nothing pressable holds "${text}"`)
    return ReactTestRenderer.act(async () => target!.props.onPress())
}

function Skeleton() {
    return <Text>skeleton</Text>
}

const ROWS: Row[] = [
    { _id: "a", name: "Acme Traders" },
    { _id: "b", name: "Bolt Logistics" },
]

function renderList(query: ListQueryResult<Row>) {
    return render(
        <ListScreen
            query={query}
            renderItem={(row) => <Text>{row.name}</Text>}
            SkeletonComponent={Skeleton}
            emptyText="No leads found"
            getCountLabel={(total) => `${total} ${total === 1 ? "lead" : "leads"} found`}
            statusMeta={LEAD_STATUS_META}
        />,
    )
}

describe("ListScreen", () => {
    it("shows five skeleton cards while the first page loads, and no count", async () => {
        const renderer = await renderList(makeQuery({ loading: true, items: ROWS }))
        const texts = getTexts(renderer)

        expect(texts.filter((text) => text === "skeleton")).toHaveLength(5)
        expect(texts).not.toContain("Acme Traders")
    })

    it("shows the rows and the count line", async () => {
        const renderer = await renderList(makeQuery({ items: ROWS, total: 2 }))
        const texts = getTexts(renderer)

        expect(texts).toContain("Acme Traders")
        expect(texts).toContain("Bolt Logistics")
        expect(texts).toContain("2 leads found")
    })

    it("shows one skeleton under the rows while the next page loads", async () => {
        const renderer = await renderList(makeQuery({ items: ROWS, total: 12, loadingMore: true }))

        expect(getTexts(renderer).filter((text) => text === "skeleton")).toHaveLength(1)
    })

    it("shows the empty text when nothing matches", async () => {
        const renderer = await renderList(makeQuery())

        expect(getTexts(renderer)).toContain("No leads found")
        expect(getTexts(renderer)).toContain("0 leads found")
    })

    it("shows the error with a retry when the first load fails", async () => {
        const query = makeQuery({ error: "Internal server error" })
        const renderer = await renderList(query)

        expect(getTexts(renderer)).toContain("Internal server error")
        await pressText(renderer, "Try again")
        expect(query.refresh).toHaveBeenCalledTimes(1)
    })

    it("renders AccessDenied with the server's message in place of the list", async () => {
        const renderer = await renderList(makeQuery({ accessError: "Admins only", items: ROWS }))
        const texts = getTexts(renderer)

        expect(texts).toContain("Access Denied")
        expect(texts).toContain("Admins only")
        expect(texts).not.toContain("Acme Traders")
    })

    it("asks for more on reaching the end and wires pull-to-refresh", async () => {
        const query = makeQuery({ items: ROWS, total: 20, pages: 2 })
        const renderer = await renderList(query)
        const list = renderer.root.findByProps({ onEndReachedThreshold: 0.5 })

        list.props.onEndReached()
        list.props.refreshControl.props.onRefresh()

        expect(query.loadMore).toHaveBeenCalledTimes(1)
        expect(query.refresh).toHaveBeenCalledTimes(1)
    })

    it("counts the active filters on the filter button", async () => {
        const query = makeQuery({ query: { ...makeQuery().query, status: "20", from: "2026-02-01" } })
        const renderer = await renderList(query)

        expect(renderer.root.findByProps({ accessibilityLabel: "Filters, 2 on" })).toBeTruthy()
    })
})

describe("ListFilters", () => {
    const EMPTY = { status: "", from: "", to: "" }

    function renderFilters(value = EMPTY) {
        const onApply = jest.fn()
        const onClose = jest.fn()
        return render(
            <ListFilters visible statusMeta={LEAD_STATUS_META} value={value} onApply={onApply} onClose={onClose} />,
        ).then((renderer) => ({ renderer, onApply, onClose }))
    }

    it("lists All statuses then every label from the META map, and hides Clear filters", async () => {
        const { renderer } = await renderFilters()
        const texts = getTexts(renderer)

        expect(texts).toContain("All statuses")
        for (const meta of Object.values(LEAD_STATUS_META)) expect(texts).toContain(meta.label)
        expect(texts).not.toContain("Clear filters")
    })

    it("applies the draft once, on close", async () => {
        const { renderer, onApply, onClose } = await renderFilters()

        await pressText(renderer, "Contacted")
        expect(onApply).not.toHaveBeenCalled()
        await pressText(renderer, "Done")

        expect(onApply).toHaveBeenCalledTimes(1)
        expect(onApply).toHaveBeenCalledWith({ status: "20", from: "", to: "" })
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("shows Clear filters while something is set, and clears the draft", async () => {
        const { renderer, onApply } = await renderFilters({ status: "40", from: "2026-02-01", to: "" })

        await pressText(renderer, "Clear filters")
        expect(getTexts(renderer)).not.toContain("Clear filters")
        await pressText(renderer, "Done")

        expect(onApply).toHaveBeenCalledWith({ status: "", from: "", to: "" })
    })
})

describe("DateField on Android", () => {
    const originalOs = Platform.OS

    beforeEach(() => {
        Object.defineProperty(Platform, "OS", { configurable: true, get: () => "android" })
    })

    afterEach(() => {
        Object.defineProperty(Platform, "OS", { configurable: true, get: () => originalOs })
    })

    it("opens the dialog inside min and max, and returns a YYYY-MM-DD string", async () => {
        const onChange = jest.fn()
        const renderer = await render(
            <DateField label="From" value="2026-03-10" min={MIN_DATE} max="2026-04-01" active onChange={onChange} />,
        )

        await ReactTestRenderer.act(async () =>
            renderer.root.findByProps({ accessibilityLabel: "From: Mar 10" }).props.onPress(),
        )

        const open = DateTimePickerAndroid.open as jest.Mock
        const options = open.mock.calls[0][0]
        expect(options.minimumDate).toEqual(new Date(2026, 0, 1))
        expect(options.maximumDate).toEqual(new Date(2026, 3, 1))

        options.onChange({ type: "dismissed" })
        expect(onChange).not.toHaveBeenCalled()
        options.onChange({ type: "set" }, new Date(2026, 2, 5))
        expect(onChange).toHaveBeenCalledWith("2026-03-05")
    })
})

describe("dates", () => {
    it("clamps into [MIN_DATE, today] as the web does", () => {
        expect(clampDate("2025-12-31", "2026-10-05")).toBe(MIN_DATE)
        expect(clampDate("2027-01-01", "2026-10-05")).toBe("2026-10-05")
        expect(clampDate("2026-05-05", "2026-10-05")).toBe("2026-05-05")
    })

    it("gives today's local date as YYYY-MM-DD", () => {
        jest.setSystemTime(new Date(2026, 9, 5, 23, 59))
        expect(todayLocal()).toBe("2026-10-05")
    })
})
