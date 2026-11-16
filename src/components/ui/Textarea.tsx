import Input, { type InputProps } from "./Input"

const DEFAULT_LINES = 4
const MIN_HEIGHT = 96

/** A multi-line Input: same label, classes, focus border and error, with the text starting at the top. */
export default function Textarea({ numberOfLines = DEFAULT_LINES, ...rest }: Omit<InputProps, "multiline">) {
    return <Input multiline numberOfLines={numberOfLines} textAlignVertical="top" minHeight={MIN_HEIGHT} {...rest} />
}
