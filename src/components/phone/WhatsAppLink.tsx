import ContactRow from "@/components/ui/ContactRow"

type WhatsAppLinkProps = {
    phone?: string
}

/** A phone number that opens a WhatsApp chat. Ported from the web's WhatsAppLink.tsx; the line is ContactRow's. */
export default function WhatsAppLink({ phone }: WhatsAppLinkProps) {
    return <ContactRow kind="phone" value={phone} />
}
