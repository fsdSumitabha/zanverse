import type { UserRole } from "@/constants/userRoles"

import type { RegionCode } from "./region"

/** An image picked on the phone, ready for FormData as `{ uri, name, type }`. */
export interface PickedImage {
    uri: string
    name: string
    type: string
    size: number
}

export interface UserFormValues {
    name: string
    email: string
    password: string
    role: UserRole
    regions: RegionCode[]
    isActive: boolean
    /** The saved avatar URL, or "" once removed. */
    avatar: string
    avatarFile: PickedImage | null
}

/** The user as `GET /users/:id` returns it. */
export interface LoadedUser {
    _id: string
    name: string
    email: string
    role: UserRole
    regions?: RegionCode[]
    isActive: boolean
    avatar?: string
}

export type UserFormEntry = [string, string | PickedImage]

function sortedJoin(regions: readonly string[]): string {
    return [...regions].sort().join(",")
}

/**
 * The form fields to send, as the web's create and edit pages build them. Create sends everything. Edit sends only
 * what changed, because the API does partial updates: a name that differs once trimmed, an email that differs in
 * lower case, the role and Active switch when different, the regions only when the set changed (an unchanged list on
 * a self-edit is the API's 403 "You cannot change your own regions"), a password only when typed, and the avatar
 * picked or removed. An empty list means nothing changed.
 */
export function getUserFormEntries(
    form: UserFormValues,
    mode: "create" | "edit",
    loaded?: LoadedUser | null,
): UserFormEntry[] {
    if (mode === "create" || !loaded) {
        return [
            ["name", form.name],
            ["email", form.email],
            ["password", form.password],
            ["role", String(form.role)],
            ...form.regions.map((region): UserFormEntry => ["regions", region]),
            ["isActive", String(form.isActive)],
            ...(form.avatarFile ? [["avatarFile", form.avatarFile] as UserFormEntry] : []),
        ]
    }

    const entries: UserFormEntry[] = []
    if (form.name.trim() !== loaded.name) entries.push(["name", form.name])
    if (form.email.trim().toLowerCase() !== loaded.email.toLowerCase()) entries.push(["email", form.email])
    if (form.role !== loaded.role) entries.push(["role", String(form.role)])
    if (form.isActive !== loaded.isActive) entries.push(["isActive", String(form.isActive)])
    if (sortedJoin(loaded.regions ?? []) !== sortedJoin(form.regions)) {
        for (const region of form.regions) entries.push(["regions", region])
    }
    if (form.password) entries.push(["password", form.password])
    if (form.avatarFile) entries.push(["avatarFile", form.avatarFile])
    else if (loaded.avatar && !form.avatar) entries.push(["removeAvatar", "true"])
    return entries
}

/** The entries as FormData, files as `{ uri, name, type }`. Null when there is nothing to send. */
export function buildUserFormData(
    form: UserFormValues,
    mode: "create" | "edit",
    loaded?: LoadedUser | null,
): FormData | null {
    const entries = getUserFormEntries(form, mode, loaded)
    if (entries.length === 0) return null
    const formData = new FormData()
    for (const [key, value] of entries) {
        if (typeof value === "string") formData.append(key, value)
        // React Native's FormData sends an object with a uri as a file part.
        else formData.append(key, { uri: value.uri, name: value.name, type: value.type } as unknown as Blob)
    }
    return formData
}
