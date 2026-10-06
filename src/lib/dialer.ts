import Clipboard from "@react-native-clipboard/clipboard"
import type { CountryCode } from "libphonenumber-js"

import { formatPhoneForDisplay } from "./phone"
import { notify } from "./notify"

/**
 * Starts a call to a lead source. Ported from the web's lead-sources/dialer.ts.
 *
 * Calling is not connected yet. For now this shows the number, with a button
 * to copy it. Every call button in the lead source screens goes through this
 * one function, so session 12 only changes the body.
 */
export function startCall(source: { name: string; phone: string }, phoneCountry: CountryCode): void {
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
}
