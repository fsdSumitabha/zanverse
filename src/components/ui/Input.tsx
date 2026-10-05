import { useState, type ComponentRef, type Ref } from "react"
import {
    TextInput,
    type NativeSyntheticEvent,
    type TargetedEvent,
    type TextInputProps,
    type TextStyle,
} from "react-native"

import { PALETTE } from "@/theme"

import Field, { FIELD_CLASSES } from "./Field"

export interface InputProps extends Omit<TextInputProps, "style" | "className"> {
    label?: string
    required?: boolean
    /** The server's `{ field, message }` text for this field. It also turns the border red. */
    error?: string | null
    /** Classes for the wrapper, such as a margin. */
    className?: string
    /** Minimum height of the box. Textarea raises it. */
    minHeight?: number
    ref?: Ref<ComponentRef<typeof TextInput>>
}

type FocusEvent = NativeSyntheticEvent<TargetedEvent>

/** Red for a server error, blue while focused, otherwise the class's own border colour. */
function getBorderColor(hasError: boolean, isFocused: boolean): string | undefined {
    if (hasError) return PALETTE["red-500"]
    if (isFocused) return PALETTE["blue-500"]
    return undefined
}

/** A labelled text field with the web's FIELD classes, a blue border while focused and the error under it. */
export default function Input({
    label,
    required = false,
    error,
    className,
    minHeight,
    onFocus,
    onBlur,
    accessibilityLabel,
    ref,
    ...rest
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false)

    // In style rather than classes: two border colour classes would be decided by stylesheet order, not by state.
    // Only keys with a value go in: an undefined borderColor would wipe out the class's border colour.
    const borderColor = getBorderColor(Boolean(error), isFocused)
    const boxStyle: TextStyle = {
        ...(borderColor ? { borderColor } : {}),
        ...(minHeight !== undefined ? { minHeight } : {}),
    }

    function handleFocus(event: FocusEvent) {
        setIsFocused(true)
        onFocus?.(event)
    }

    function handleBlur(event: FocusEvent) {
        setIsFocused(false)
        onBlur?.(event)
    }

    return (
        <Field label={label} required={required} error={error} className={className}>
            <TextInput
                ref={ref}
                placeholderTextColor={PALETTE["neutral-400"]}
                accessibilityLabel={accessibilityLabel ?? label}
                accessibilityState={{ disabled: rest.editable === false }}
                {...rest}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={FIELD_CLASSES}
                style={boxStyle}
            />
        </Field>
    )
}
