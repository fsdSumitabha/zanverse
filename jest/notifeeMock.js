/* eslint-env jest */
// A stand-in for @notifee/react-native in Jest. It keeps the scheduled reminders in memory, so a test can read what is
// set to ring and see a cancel remove it. The enum values are Notifee's own.

const triggers = new Map()

const notifee = {
    createChannel: jest.fn(async (channel) => channel.id),
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1, android: { alarm: 1 } })),
    createTriggerNotification: jest.fn(async (notification, trigger) => {
        triggers.set(notification.id, { notification, trigger })
        return notification.id
    }),
    cancelTriggerNotification: jest.fn(async (id) => {
        triggers.delete(id)
    }),
    cancelNotification: jest.fn(async (id) => {
        triggers.delete(id)
    }),
    cancelTriggerNotifications: jest.fn(async (ids) => {
        if (ids) ids.forEach((id) => triggers.delete(id))
        else triggers.clear()
    }),
    getTriggerNotificationIds: jest.fn(async () => [...triggers.keys()]),
    displayNotification: jest.fn(async (notification) => notification.id ?? "displayed"),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn(async () => null),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
}

module.exports = {
    __esModule: true,
    default: notifee,
    /** The reminders set to ring, by notification id. Tests read and clear it. */
    scheduledTriggers: triggers,
    AndroidImportance: { DEFAULT: 3, HIGH: 4 },
    AndroidNotificationSetting: { NOT_SUPPORTED: -1, DISABLED: 0, ENABLED: 1 },
    AlarmType: {
        SET: 0,
        SET_AND_ALLOW_WHILE_IDLE: 1,
        SET_EXACT: 2,
        SET_EXACT_AND_ALLOW_WHILE_IDLE: 3,
        SET_ALARM_CLOCK: 4,
    },
    AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
    EventType: { UNKNOWN: -1, DISMISSED: 0, PRESS: 1 },
    TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
}
