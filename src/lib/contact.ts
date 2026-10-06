import Clipboard from "@react-native-clipboard/clipboard"
import type { CountryCode } from "libphonenumber-js"
import { Linking } from "react-native"

import { notify } from "./notify"
import { formatPhoneForDisplay, toWhatsAppNumber } from "./phone"

/**
 * Starts a call to a lead source: the phone's dialer opens with the number filled in. Every call button in the lead
 * source screens goes through this one function. When no dialer opens (an emulator, a tablet), the web's toast shows
 * the number with a Copy action, word for word.
 */
export function startCall(source: { name: string; phone: string }, phoneCountry: CountryCode): void {
    Linking.openURL(`tel:${source.phone}`).catch(() => {
        const shown = formatPhoneForDisplay(source.phone, phoneCountry)
        notify.info(`Call ${source.name}`, {
            id: "lead-source-call",
            description: `${shown}. Calling from the CRM is not set up yet. Dial this number on your phone.`,
            action: {
                label: "Copy number",
                onClick: () => {
                    Clipboard.setString(source.phone)
                    notify.success("Number copied")
                },
            },
        })
    })
}

/**
 * Opens a WhatsApp chat with the number. `https://wa.me/` opens WhatsApp when it is installed and the browser when it
 * is not. A missing or invalid number does nothing: a chat would go to the wrong person, or to nobody.
 */
export function openWhatsApp(phone: string | null | undefined, phoneCountry: CountryCode): void {
    const number = toWhatsAppNumber(phone, phoneCountry)
    if (!number) return
    Linking.openURL(`https://wa.me/${number}?text=`).catch(() => notify.error("Could not open WhatsApp"))
}

/** Opens the mail app with a new message to `email`. */
export function openEmail(email: string): void {
    Linking.openURL(`mailto:${email}`).catch(() => notify.error("Could not open the mail app"))
}
