// A stand-in for @gorhom/bottom-sheet in Jest. The real package needs Reanimated and native gestures, which the test
// renderer does not run. This keeps the parts the app relies on: a modal renders its content only between present()
// and dismiss(), every dismissal calls onDismiss, a plain sheet's close() calls onClose, and the backdrop closes the
// sheet it belongs to. Scrollables and the text input become their React Native counterparts.

const React = require("react")
const RN = require("react-native")

const CloseContext = React.createContext(null)
const NO_STYLE = {}
const SHARED_ZERO = { value: 0 }

function renderBackdrop(Backdrop) {
    if (!Backdrop) return null
    return React.createElement(Backdrop, { animatedIndex: SHARED_ZERO, animatedPosition: SHARED_ZERO, style: NO_STYLE })
}

function BottomSheetModalProvider({ children }) {
    return children
}

const BottomSheetModal = React.forwardRef(function BottomSheetModal(props, ref) {
    const [isPresented, setIsPresented] = React.useState(false)
    const isPresentedRef = React.useRef(false)
    const onDismissRef = React.useRef(props.onDismiss)
    onDismissRef.current = props.onDismiss

    const dismiss = React.useCallback(() => {
        if (!isPresentedRef.current) return
        isPresentedRef.current = false
        setIsPresented(false)
        onDismissRef.current?.()
    }, [])

    React.useImperativeHandle(ref, () => ({
        present() {
            isPresentedRef.current = true
            setIsPresented(true)
        },
        dismiss,
        close: dismiss,
        forceClose: dismiss,
        expand() {},
        collapse() {},
        snapToIndex() {},
        snapToPosition() {},
    }))

    if (!isPresented) return null
    return React.createElement(
        CloseContext.Provider,
        { value: dismiss },
        renderBackdrop(props.backdropComponent),
        props.children,
    )
})

const BottomSheet = React.forwardRef(function BottomSheet(props, ref) {
    const onCloseRef = React.useRef(props.onClose)
    onCloseRef.current = props.onClose
    const close = React.useCallback(() => onCloseRef.current?.(), [])

    React.useImperativeHandle(ref, () => ({
        close,
        forceClose: close,
        expand() {},
        collapse() {},
        snapToIndex() {},
        snapToPosition() {},
    }))

    if (props.index === -1) return null
    return React.createElement(
        CloseContext.Provider,
        { value: close },
        renderBackdrop(props.backdropComponent),
        props.children,
    )
})

function BottomSheetBackdrop({ pressBehavior, onPress, accessibilityLabel }) {
    const close = React.useContext(CloseContext)
    function handlePress() {
        onPress?.()
        if (pressBehavior === "close") close?.()
    }
    return React.createElement(RN.Pressable, {
        accessibilityRole: "button",
        accessibilityLabel: accessibilityLabel ?? "Bottom sheet backdrop",
        onPress: handlePress,
    })
}

// Its own component, as in the real package, so registering it with NativeWind leaves TextInput alone.
const BottomSheetTextInput = React.forwardRef(function BottomSheetTextInput(props, ref) {
    return React.createElement(RN.TextInput, { ...props, ref })
})

// Own components too, so the NativeWind mapping for them leaves ScrollView and FlatList as they are.
const BottomSheetScrollView = React.forwardRef(function BottomSheetScrollView(props, ref) {
    return React.createElement(RN.ScrollView, { ...props, ref })
})

const BottomSheetFlatList = React.forwardRef(function BottomSheetFlatList(props, ref) {
    return React.createElement(RN.FlatList, { ...props, ref })
})

function BottomSheetView({ children, ...rest }) {
    return React.createElement(RN.View, rest, children)
}

module.exports = {
    __esModule: true,
    default: BottomSheet,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetFlatList,
    BottomSheetSectionList: RN.SectionList,
    BottomSheetTextInput,
    useBottomSheetModal: () => ({ dismiss() {}, dismissAll() {} }),
}
