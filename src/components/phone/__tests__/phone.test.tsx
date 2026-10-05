import { Text, TextInput } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import PhoneField from "@/components/phone/PhoneField"
import PhoneHint from "@/components/phone/PhoneHint"
import { useEditablePhone, type EditablePhone } from "@/components/phone/useEditablePhone"
import { PHONE_MESSAGES } from "@/lib/phone"

let phone: EditablePhone

function Harness({ saved }: { saved?: string }) {
    phone = useEditablePhone(saved)
    return (
        <>
            <PhoneField {...phone.fieldProps} />
            <PhoneHint error={phone.error} savedInvalid={phone.savedInvalid} />
        </>
    )
}

async function render(saved?: string) {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<Harness saved={saved} />)
    })
    return renderer!
}

function getInput(renderer: ReactTestRenderer.ReactTestRenderer) {
    return renderer.root.findByType(TextInput)
}

async function type(renderer: ReactTestRenderer.ReactTestRenderer, next: string) {
    await ReactTestRenderer.act(async () => getInput(renderer).props.onChangeText(next))
}

function getTexts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

function check(focus = false): string | null {
    let result: string | null = null
    ReactTestRenderer.act(() => {
        result = phone.check({ focus })
    })
    return result
}

describe("useEditablePhone", () => {
    it("returns the saved legacy value when the number is unchanged", async () => {
        const renderer = await render("9876543210")

        expect(getInput(renderer).props.value).toBe("098765 43210")
        expect(check()).toBe("9876543210")
        expect(phone.error).toBe("")
    })

    it("keeps an invalid saved value while the box is empty, with the note under the field", async () => {
        const renderer = await render("N/A")

        expect(getInput(renderer).props.value).toBe("")
        expect(phone.savedInvalid).toBe("N/A")
        expect(getTexts(renderer).join(" ")).toContain('Saved value "N/A" is not a valid number.')
        expect(check()).toBe("N/A")
    })

    it("returns E.164 for a changed number", async () => {
        const renderer = await render("9876543210")

        await type(renderer, "91234 56789")

        expect(check()).toBe("+919123456789")
    })

    it("refuses an invalid number with the library's message", async () => {
        const renderer = await render()

        await type(renderer, "12345")
        expect(check(true)).toBeNull()

        expect(phone.error).toBe(PHONE_MESSAGES.TOO_SHORT)
        expect(getTexts(renderer)).toContain(PHONE_MESSAGES.TOO_SHORT)
    })

    it("lets setError show a server message under the field, and typing clears it", async () => {
        const renderer = await render()

        await ReactTestRenderer.act(async () => phone.setError("A lead with this phone already exists"))
        expect(getTexts(renderer)).toContain("A lead with this phone already exists")

        await type(renderer, "9")
        expect(phone.error).toBe("")
    })
})

describe("PhoneField", () => {
    it("takes typed digits, one at a time", async () => {
        const renderer = await render()

        await type(renderer, "9")
        await type(renderer, "98")

        expect(getInput(renderer).props.value).toBe("98")
    })

    it("refuses a typed + with the country code message", async () => {
        const renderer = await render()

        await type(renderer, "+")

        expect(getInput(renderer).props.value).toBe("")
        expect(phone.error).toBe(PHONE_MESSAGES.HAS_COUNTRY_CODE)
    })

    it("refuses pasted text with a number inside it, and leaves the box as it was", async () => {
        const renderer = await render()

        await type(renderer, "Call after 6pm: 415 555 0146")

        expect(getInput(renderer).props.value).toBe("")
        expect(phone.error).not.toBe("")
    })

    it("puts in a pasted full number for the picked country as the local number", async () => {
        const renderer = await render()

        await type(renderer, "+91 98765 43210")

        expect(getInput(renderer).props.value).toBe("098765 43210")
        expect(check()).toBe("+919876543210")
    })

    it("refuses a pasted number from another country", async () => {
        const renderer = await render()

        await type(renderer, "+1 415 555 0123")

        expect(getInput(renderer).props.value).toBe("")
        expect(phone.error).toBe(PHONE_MESSAGES.OTHER_COUNTRY)
    })

    it("lets a digit too many stay in the box, and the check refuses it", async () => {
        const renderer = await render()

        await type(renderer, "98765432101")

        // No length limit cuts the extra digit. lib/phone.ts decides the message ("not valid" for 11 Indian digits).
        expect(getInput(renderer).props.value).toBe("98765432101")
        expect(check()).toBeNull()
        expect([PHONE_MESSAGES.TOO_LONG, PHONE_MESSAGES.INVALID]).toContain(phone.error)
    })

    it("shows the picked country and its calling code", async () => {
        const renderer = await render()

        expect(renderer.root.findByProps({ accessibilityLabel: "Country: IN +91" })).toBeTruthy()
    })
})
