// RN copy, data only. The web's version also imports the server dispatchers (dispatchEmail, dispatchSms,
// dispatchPush) and puts each one on a `channel` field. Those stay on the server. Codes and labels are unchanged.

export const NOTIFICATION_CHANNEL = {
    2: { label: "Email" },
    3: { label: "SMS" },
    4: { label: "Web Push" },
} as const

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNEL
