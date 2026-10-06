import { Platform } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"

import { ApiError, getApiHeaders, readApiResult } from "@/api/client"
import { resolveApiUrl } from "@/api/endpoints"

import { notify } from "./notify"

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/**
 * Downloads an .xlsx from an authenticated route into the cache directory and opens it in the phone's spreadsheet
 * app. A plain link cannot do this: it sends no Authorization header. A refusal toasts the server's message.
 */
export async function downloadXlsx(path: string, fileName: string): Promise<void> {
    const { token, headers } = getApiHeaders()
    const target = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`
    try {
        const res = await ReactNativeBlobUtil.config({ fileCache: true, path: target }).fetch(
            "GET",
            resolveApiUrl(path),
            headers,
        )
        const status = res.info().status
        if (status < 200 || status >= 300) {
            // An error body is JSON written to the file in place of the workbook.
            const text = await ReactNativeBlobUtil.fs.readFile(res.path(), "utf8").catch(() => "")
            await ReactNativeBlobUtil.fs.unlink(res.path()).catch(() => undefined)
            let json: unknown = null
            try {
                json = JSON.parse(String(text))
            } catch {
                json = null
            }
            await readApiResult(status, json, token)
            return
        }
        await openSaved(res.path(), fileName)
    } catch (error) {
        notify.error(
            error instanceof ApiError || error instanceof Error ? error.message : "Could not download the file",
        )
    }
}

async function openSaved(savedPath: string, fileName: string) {
    if (Platform.OS === "android") {
        try {
            await ReactNativeBlobUtil.android.actionViewIntent(savedPath, XLSX_MIME)
        } catch {
            // No app on this phone opens .xlsx. The file is still saved.
            notify.info(`${fileName} saved`, { description: `No app here opens .xlsx files. It is in ${savedPath}.` })
        }
        return
    }
    await ReactNativeBlobUtil.ios.openDocument(savedPath)
}
