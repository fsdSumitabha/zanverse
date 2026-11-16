/** Roles that may edit a note or a status change's remarks. Copied from the web's NoteItem and StatusChangeItem. */
export const INTERACTION_EDIT_ROLES: readonly number[] = [10, 15, 60, 69, 45, 50, 70]

/** True when the role may edit timeline notes and remarks. */
export function canEditInteraction(role: number | null | undefined): boolean {
    return role != null && INTERACTION_EDIT_ROLES.includes(role)
}
