import { errorCodes, isErrorWithCode, keepLocalCopy, pick } from "@react-native-documents/picker"
import ReactNativeBlobUtil from "react-native-blob-util"

import { getApiHeaders, readApiResult } from "@/api/client"
import { LEAD_SOURCE_UPLOADS_API, resolveApiUrl } from "@/api/endpoints"

import { todayString } from "./leadSourceDay"

/** A sheet picked on the phone and copied into the app's cache, so its path stays readable during the upload. */
export interface PickedSheet {
    /** A plain file path, without "file://". */
    path: string
    name: string
    size: number
    type: string
}

export interface UploadCounts {
    read: number
    imported: number
    warned: number
    skipped: number
}

interface UploadOptions {
    file: PickedSheet
    region: string | null
    assignedTo: string
    allottedDay: string | null
    /** A share from 0 to 1. */
    onProgress: (share: number) => void
}

// The three types the web's dropzone accepts. Android labels some CSV files as application/vnd.ms-excel.
const SHEET_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-excel",
]
const PROGRESS_INTERVAL_MS = 250
const BYTES_PER_MB = 1024 * 1024

/** "48 KB", "1.3 MB". Verbatim from the web's UploadForm. */
export function sizeText(bytes: number): string {
    if (bytes < BYTES_PER_MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`
}

/** The server's refusal for a file it would not take, checked before any request. Null when the file is fine. */
export function getSheetRejection(name: string, size: number, maxFileMb: number): string | null {
    // An old .xls, or any other kind of file.
    if (!/\.(xlsx|csv)$/i.test(name))
        return "Choose an .xlsx or a .csv file. For an old .xls file, save it as .xlsx first."
    if (size === 0) return "The file is empty."
    if (size > maxFileMb * BYTES_PER_MB) return `The file is larger than ${maxFileMb} MB. Split it into smaller files.`
    return null
}

/** One file from the system picker, or null when the person cancels. */
async function pickOne() {
    try {
        const [picked] = await pick({ type: SHEET_TYPES })
        return picked
    } catch (error) {
        if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return null
        throw error
    }
}

/**
 * Opens the system file picker for one .xlsx or .csv, checks it, and copies it into the cache directory. Resolves
 * null when the person cancels. Throws an Error with the refusal text for a file the server would refuse.
 */
export async function pickSheetFile(maxFileMb: number): Promise<PickedSheet | null> {
    const picked = await pickOne()
    if (!picked) return null

    const name = picked.name ?? "sheet.xlsx"
    const size = picked.size ?? 0
    const rejection = getSheetRejection(name, size, maxFileMb)
    if (rejection) throw new Error(rejection)

    // A content:// uri can stop being readable once the picker's grant ends. A cache copy cannot.
    const [copy] = await keepLocalCopy({ files: [{ uri: picked.uri, fileName: name }], destination: "cachesDirectory" })
    if (copy.status !== "success") throw new Error(copy.copyError || "Could not read the file")

    return {
        path: decodeURIComponent(copy.localUri.replace(/^file:\/\//, "")),
        name,
        size,
        type: picked.type ?? SHEET_TYPES[0],
    }
}

/**
 * Uploads a sheet as multipart form data, with upload progress, to `POST /lead-sources/uploads`. Same parts as the
 * web's UploadForm, same Bearer and region headers as client.ts, and the same ApiError on a refusal, so
 * `details.found` and a 401 behave as for any other request.
 */
export async function uploadSheet({ file, region, assignedTo, allottedDay, onProgress }: UploadOptions) {
    const { token, headers } = getApiHeaders()
    const parts = [
        { name: "file", filename: file.name, type: file.type, data: ReactNativeBlobUtil.wrap(file.path) },
        { name: "today", data: todayString() },
        ...(region ? [{ name: "region", data: region }] : []),
        ...(assignedTo ? [{ name: "assignedTo", data: assignedTo }] : []),
        ...(allottedDay ? [{ name: "allottedDay", data: allottedDay }] : []),
    ]

    // blob-util builds a multipart body only when told so; it writes the boundary into this header itself.
    const res = await ReactNativeBlobUtil.fetch(
        "POST",
        resolveApiUrl(LEAD_SOURCE_UPLOADS_API),
        { ...headers, "Content-Type": "multipart/form-data" },
        parts,
    ).uploadProgress({ interval: PROGRESS_INTERVAL_MS }, (sent, total) => {
        if (total > 0) onProgress(Math.min(1, sent / total))
    })

    let json: unknown = null
    try {
        json = res.json()
    } catch {
        json = null
    }
    const envelope = await readApiResult<{ data: { uploadId: string; counts: UploadCounts } }>(
        res.info().status,
        json,
        token,
    )
    return envelope.data
}
