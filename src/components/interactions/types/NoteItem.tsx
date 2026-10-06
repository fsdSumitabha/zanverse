import { FileText } from "lucide-react-native"
import { useState } from "react"
import { Text } from "react-native"

import { Badge } from "@/components/ui"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { useAuth } from "@/contexts/AuthContext"

import { canEditInteraction } from "../canEditInteraction"
import EditHistory from "../EditHistory"
import InteractionEditor from "../InteractionEditor"
import InteractionRowFrame from "../InteractionRowFrame"
import RowHeader, { RowTitle } from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

interface Props {
    item: TimelineItem
    onChanged?: () => void
}

/** A note (2110), with its title and description editable in place. Ported from the web's NoteItem.tsx. */
export default function NoteItem({ item, onChanged }: Props) {
    const { role } = useAuth()
    const [editing, setEditing] = useState(false)
    const allowed = canEditInteraction(role)

    return (
        <InteractionRowFrame icon={FileText} createdBy={item.createdBy}>
            <RowHeader
                createdAt={item.createdAt}
                onEdit={allowed && !editing ? () => setEditing(true) : undefined}
                editLabel="Edit note"
            >
                {!!item.title && !editing && <RowTitle>{item.title}</RowTitle>}
                <Badge meta={INTERACTION_TYPE_META} status={item.type} />
            </RowHeader>

            {editing ? (
                <InteractionEditor
                    interactionId={String(item._id)}
                    initialTitle={item.title ?? ""}
                    initialDescription={item.description ?? ""}
                    showTitle
                    onCancel={() => setEditing(false)}
                    onSaved={() => {
                        setEditing(false)
                        onChanged?.()
                    }}
                />
            ) : (
                !!item.description && (
                    <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
                )
            )}

            {!editing && (
                <EditHistory history={item.editHistory} createdBy={item.createdBy} createdAt={item.createdAt} />
            )}
        </InteractionRowFrame>
    )
}
