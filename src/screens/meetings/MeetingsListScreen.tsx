import { MEETINGS_API } from "@/api/endpoints"
import ListScreen from "@/components/list/ListScreen"
import MeetingCard, { type MeetingListItem } from "@/components/meetings/MeetingCard"
import MeetingCardSkeleton from "@/components/meetings/MeetingCardSkeleton"
import MeetingFilters from "@/components/meetings/MeetingFilters"
import { useListQuery } from "@/hooks/useListQuery"

const PAGE_SIZE = 10

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "meeting" : "meetings"}`
}

/**
 * Every meeting, newest scheduled time first, with search, status, entity and range filters. Reschedule, cancel and
 * complete refresh the list in place. Ported from the web's MeetingsClient.tsx.
 */
export default function MeetingsListScreen() {
    const query = useListQuery<MeetingListItem>({ path: MEETINGS_API, pageSize: PAGE_SIZE })

    return (
        <ListScreen
            query={query}
            renderItem={(meeting) => <MeetingCard meeting={meeting} onChanged={query.refresh} />}
            SkeletonComponent={MeetingCardSkeleton}
            emptyText="No meetings found"
            getCountLabel={getCountLabel}
            searchPlaceholder="Search meetings"
            headerExtra={<MeetingFilters query={query.query} onChange={query.setFilters} />}
        />
    )
}
