import { keepLocalCopy, pick } from "@react-native-documents/picker"
import { Platform } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"

import { API_BASE_URL } from "@/api/endpoints"
import { ApiError } from "@/api/client"
import { downloadXlsx } from "@/lib/downloadFile"
import { getSheetRejection, pickSheetFile, sizeText, uploadSheet } from "@/lib/leadSourceUpload"
import { notify } from "@/lib/notify"
import { saveToken } from "@/store/keychain"

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const blob = ReactNativeBlobUtil as unknown as {
    fetch: jest.Mock
    config: jest.Mock
    android: { actionViewIntent: jest.Mock }
    fs: { readFile: jest.Mock; unlink: jest.Mock }
}

function makeResponse(status: number, body: unknown) {
    return { info: () => ({ status }), json: () => body, path: () => "/data/user/0/com.zanverse/cache/file.xlsx" }
}

beforeEach(async () => {
    jest.clearAllMocks()
    await saveToken("jwt-1")
})

afterEach(() => jest.restoreAllMocks())

describe("sizeText and getSheetRejection", () => {
    it("writes sizes as the web does", () => {
        expect(sizeText(300)).toBe("1 KB")
        expect(sizeText(48 * 1024)).toBe("48 KB")
        expect(sizeText(1.3 * 1024 * 1024)).toBe("1.3 MB")
    })

    it("refuses an .xls, an empty file and a file over the limit, in the server's words", () => {
        const wrongType = "Choose an .xlsx or a .csv file. For an old .xls file, save it as .xlsx first."
        expect(getSheetRejection("old.xls", 100, 5)).toBe(wrongType)
        expect(getSheetRejection("notes.pdf", 100, 5)).toBe(wrongType)
        expect(getSheetRejection("empty.csv", 0, 5)).toBe("The file is empty.")
        expect(getSheetRejection("big.xlsx", 6 * 1024 * 1024, 5)).toBe(
            "The file is larger than 5 MB. Split it into smaller files.",
        )
        expect(getSheetRejection("leads.XLSX", 100, 5)).toBeNull()
    })
})

describe("pickSheetFile", () => {
    it("copies the picked file into the cache and returns a plain path", async () => {
        ;(pick as jest.Mock).mockResolvedValue([
            { uri: "content://x/1", name: "My leads.xlsx", size: 2048, type: XLSX },
        ])
        ;(keepLocalCopy as jest.Mock).mockResolvedValue([
            { status: "success", sourceUri: "content://x/1", localUri: "file:///data/cache/My%20leads.xlsx" },
        ])
        await expect(pickSheetFile(5)).resolves.toEqual({
            path: "/data/cache/My leads.xlsx",
            name: "My leads.xlsx",
            size: 2048,
            type: XLSX,
        })
        expect(keepLocalCopy).toHaveBeenCalledWith({
            files: [{ uri: "content://x/1", fileName: "My leads.xlsx" }],
            destination: "cachesDirectory",
        })
    })

    it("refuses an .xls before copying it", async () => {
        ;(pick as jest.Mock).mockResolvedValue([{ uri: "content://x/2", name: "old.xls", size: 2048, type: "x" }])
        await expect(pickSheetFile(5)).rejects.toThrow("For an old .xls file, save it as .xlsx first.")
        expect(keepLocalCopy).not.toHaveBeenCalled()
    })
})

describe("uploadSheet", () => {
    const file = { path: "/data/cache/leads.xlsx", name: "leads.xlsx", size: 2048, type: XLSX }

    it("posts the web's parts with the token, reports progress and returns the upload", async () => {
        const counts = { read: 3, imported: 3, warned: 0, skipped: 0 }
        blob.fetch.mockReturnValue({
            uploadProgress: (_config: unknown, onSent: (sent: number, total: number) => void) => {
                onSent(512, 1024)
                onSent(1024, 1024)
                return Promise.resolve(makeResponse(201, { success: true, data: { uploadId: "up1", counts } }))
            },
        })
        const progress: number[] = []

        const result = await uploadSheet({
            file,
            region: "IN",
            assignedTo: "",
            allottedDay: "2026-10-07",
            onProgress: (share) => progress.push(share),
        })

        expect(result).toEqual({ uploadId: "up1", counts })
        expect(progress).toEqual([0.5, 1])
        const [method, url, headers, parts] = blob.fetch.mock.calls[0]
        expect([method, url]).toEqual(["POST", `${API_BASE_URL}/api/admin/operations/lead-sources/uploads`])
        expect(headers).toMatchObject({ Authorization: "Bearer jwt-1", "Content-Type": "multipart/form-data" })
        expect(parts.map((part: { name: string }) => part.name)).toEqual(["file", "today", "region", "allottedDay"])
        expect(parts[0]).toEqual({
            name: "file",
            filename: "leads.xlsx",
            type: XLSX,
            data: "RNFetchBlob-file:///data/cache/leads.xlsx",
        })
    })

    it("throws the server's ApiError with its details", async () => {
        blob.fetch.mockReturnValue({
            uploadProgress: () =>
                Promise.resolve(
                    makeResponse(400, {
                        success: false,
                        message: "The file has no phone column.",
                        details: { found: ["name", "mobile no"] },
                    }),
                ),
        })
        const error = await uploadSheet({
            file,
            region: null,
            assignedTo: "",
            allottedDay: null,
            onProgress: jest.fn(),
        }).catch((caught: unknown) => caught)
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).details).toEqual({ found: ["name", "mobile no"] })
    })
})

describe("downloadXlsx", () => {
    it("saves the workbook in the cache with the token and opens it", async () => {
        // The Jest preset runs as iOS. Android is the target.
        jest.replaceProperty(Platform, "OS", "android")
        const fetchFile = jest.fn().mockResolvedValue(makeResponse(200, null))
        blob.config.mockReturnValue({ fetch: fetchFile })

        await downloadXlsx("/api/admin/operations/lead-sources/template", "lead-source-template.xlsx")

        expect(blob.config).toHaveBeenCalledWith({
            fileCache: true,
            path: "/data/user/0/com.zanverse/cache/lead-source-template.xlsx",
        })
        expect(fetchFile.mock.calls[0][2]).toMatchObject({ Authorization: "Bearer jwt-1" })
        expect(blob.android.actionViewIntent).toHaveBeenCalledWith("/data/user/0/com.zanverse/cache/file.xlsx", XLSX)
    })

    it("toasts the server's message instead of opening an error body", async () => {
        const error = jest.spyOn(notify, "error")
        blob.config.mockReturnValue({ fetch: jest.fn().mockResolvedValue(makeResponse(403, null)) })
        blob.fs.readFile.mockResolvedValue(JSON.stringify({ success: false, message: "Managers only." }))

        await downloadXlsx("/api/admin/operations/lead-sources/template", "lead-source-template.xlsx")

        expect(error).toHaveBeenCalledWith("Managers only.")
        expect(blob.fs.unlink).toHaveBeenCalled()
        expect(blob.android.actionViewIntent).not.toHaveBeenCalled()
    })
})
