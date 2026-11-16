/* eslint-env jest */
// A stand-in for react-native-notify-kit in Jest. It keeps the scheduled reminders, the created channels and the shown
// notifications in memory, so a test can read what is set to ring, which channels Settings would list, and what the
// tray holds. The enum values are the library's own.

const triggers = new Map()
const channels = new Map()
const groups = new Map()
const displayed = new Map()

const notifee = {
    createChannel: jest.fn(async (channel) => {
        channels.set(channel.id, { blocked: false, ...channel })
        return channel.id
    }),
    createChannelGroup: jest.fn(async (group) => {
        groups.set(group.id, { blocked: false, channels: [], ...group })
        return group.id
    }),
    deleteChannel: jest.fn(async (id) => {
        channels.delete(id)
    }),
    getChannels: jest.fn(async () => [...channels.values()]),
    getChannelGroups: jest.fn(async () => [...groups.values()]),
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
        displayed.delete(id)
    }),
    cancelDisplayedNotification: jest.fn(async (id) => {
        displayed.delete(id)
    }),
    cancelDisplayedNotifications: jest.fn(async (ids) => {
        if (ids) ids.forEach((id) => displayed.delete(id))
        else displayed.clear()
    }),
    cancelTriggerNotifications: jest.fn(async (ids) => {
        if (ids) ids.forEach((id) => triggers.delete(id))
        else triggers.clear()
    }),
    getTriggerNotificationIds: jest.fn(async () => [...triggers.keys()]),
    getDisplayedNotifications: jest.fn(async () =>
        [...displayed.entries()].map(([id, notification]) => ({ id, date: "", notification })),
    ),
    displayNotification: jest.fn(async (notification) => {
        const id = notification.id ?? `shown-${displayed.size + 1}`
        displayed.set(id, notification)
        return id
    }),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn(async () => null),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
    openNotificationSettings: jest.fn(async () => undefined),
    openBatteryOptimizationSettings: jest.fn(async () => undefined),
    isBatteryOptimizationEnabled: jest.fn(async () => false),
}

module.exports = {
    __esModule: true,
    default: notifee,
    /** The reminders set to ring, by notification id. Tests read and clear it. */
    scheduledTriggers: triggers,
    /** The channels created, by id, as Android Settings would list them. */
    createdChannels: channels,
    /** The channel groups created, by id. */
    createdChannelGroups: groups,
    /** The notifications in the tray, by id. */
    displayedNotifications: displayed,
    AndroidImportance: { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4 },
    AndroidVisibility: { SECRET: -1, PRIVATE: 0, PUBLIC: 1 },
    AndroidGroupAlertBehavior: { ALL: 0, SUMMARY: 1, CHILDREN: 2 },
    AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1, INBOX: 2, MESSAGING: 3 },
    AndroidNotificationSetting: { NOT_SUPPORTED: -1, DISABLED: 0, ENABLED: 1 },
    AlarmType: {
        SET: 0,
        SET_AND_ALLOW_WHILE_IDLE: 1,
        SET_EXACT: 2,
        SET_EXACT_AND_ALLOW_WHILE_IDLE: 3,
        SET_ALARM_CLOCK: 4,
    },
    AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
    EventType: { UNKNOWN: -1, DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3 },
    TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
}
