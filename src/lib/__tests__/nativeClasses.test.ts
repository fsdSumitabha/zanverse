import { toNativeClasses } from "@/lib/nativeClasses"

describe("toNativeClasses", () => {
    test("splits the web's BUTTON_PRIMARY between the pressable and its text", () => {
        expect(
            toNativeClasses(
                "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition",
            ),
        ).toEqual({
            container: "items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2",
            text: "text-sm font-medium text-white",
        })
    })

    test("keeps dark: variants on the right side and drops dark:hover:", () => {
        expect(
            toNativeClasses(
                "rounded-lg border border-slate-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition",
            ),
        ).toEqual({
            container: "rounded-lg border border-slate-300 dark:border-neutral-700 px-4 py-2",
            text: "text-sm font-medium text-neutral-700 dark:text-neutral-200",
        })
    })

    test("drops focus rings and placeholder classes from the web's FIELD", () => {
        const { container, text } = toNativeClasses(
            "w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        )
        expect(container).toBe(
            "w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2",
        )
        expect(text).toBe("text-sm text-neutral-800 dark:text-neutral-100")
    })

    test("drops group, shadows and transitions, and keeps the active: pressed state", () => {
        const { container } = toNativeClasses(
            "group w-full flex gap-2 rounded transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md",
        )
        expect(container).toBe("w-full flex gap-2 rounded active:scale-[0.98]")
    })

    test("text alignment and arbitrary text sizes count as text", () => {
        expect(toNativeClasses("p-2 text-center text-[11px] leading-5 tracking-wide uppercase")).toEqual({
            container: "p-2",
            text: "text-center text-[11px] leading-5 tracking-wide uppercase",
        })
    })

    test("an empty string gives two empty strings", () => {
        expect(toNativeClasses("  ")).toEqual({ container: "", text: "" })
    })
})
