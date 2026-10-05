// `type`, not `interface`: React Navigation needs param lists that fit `Record<string, object | undefined>`,
// and only type aliases get that index signature implicitly.

/** Routes of the root native stack. `Tabs` holds the bottom tab navigator. */
export type SpikeStackParamList = {
    Tabs: undefined
    SpikePushed: undefined
}

/** Routes of the bottom tab navigator. */
export type SpikeTabParamList = {
    SpikeHome: undefined
    SpikeTabTwo: undefined
}
