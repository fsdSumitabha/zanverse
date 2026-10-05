import ReactTestRenderer from "react-test-renderer"

import App from "../App"

// Tab switches start animations and timers. Fake timers let the test flush them before Jest tears down.
jest.useFakeTimers()

test("renders the spike tabs and opens the second tab", async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<App />)
    })
    const root = renderer!.root

    expect(root.findAllByProps({ children: "Session 1 spike" }).length).toBeGreaterThan(0)
    expect(root.findAllByProps({ children: "Interested" }).length).toBeGreaterThan(0)
    expect(root.findAllByProps({ children: 'set/getString → "ok"' }).length).toBeGreaterThan(0)
    expect(root.findAllByProps({ children: "+91 98765 43210 · valid: true" }).length).toBeGreaterThan(0)

    const callsTab = root.findAll(
        (node) => node.props.accessibilityLabel?.startsWith?.("Calls") && node.props.onPress,
    )[0]
    await ReactTestRenderer.act(async () => {
        callsTab.props.onPress()
        jest.runAllTimers()
    })

    expect(root.findAllByProps({ children: "Tab two" }).length).toBeGreaterThan(0)

    await ReactTestRenderer.act(async () => {
        renderer!.unmount()
        jest.runAllTimers()
    })
})
