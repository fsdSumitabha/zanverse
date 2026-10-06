import { Linking } from "react-native"

import { openEmail, openWhatsApp, startCall } from "@/lib/contact"
import { notify } from "@/lib/notify"

async function settle() {
    await Promise.resolve()
    await Promise.resolve()
}

describe("contact", () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })

    it("opens the dialer with the stored number", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const info = jest.spyOn(notify, "info").mockImplementation(() => undefined)
        startCall({ name: "Acme", phone: "+919876543210" }, "IN")
        await settle()
        expect(open).toHaveBeenCalledWith("tel:+919876543210")
        expect(info).not.toHaveBeenCalled()
    })

    it("falls back to the web's toast when no dialer opens", async () => {
        jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("No activity"))
        const info = jest.spyOn(notify, "info").mockImplementation(() => undefined)
        startCall({ name: "Acme", phone: "+919876543210" }, "IN")
        await settle()
        expect(info).toHaveBeenCalledWith(
            "Call Acme",
            expect.objectContaining({
                id: "lead-source-call",
                description: "+91 98765 43210. Calling from the CRM is not set up yet. Dial this number on your phone.",
            }),
        )
    })

    it("opens WhatsApp through wa.me with the digits only, and does nothing for an invalid number", () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        openWhatsApp("+919876543210", "IN")
        openWhatsApp("12", "IN")
        openWhatsApp(undefined, "IN")
        expect(open.mock.calls).toEqual([["https://wa.me/919876543210?text="]])
    })

    it("opens the mail app", () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        openEmail("hello@acme.test")
        expect(open).toHaveBeenCalledWith("mailto:hello@acme.test")
    })
})
