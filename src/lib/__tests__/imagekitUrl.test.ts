import { getImagekitUrl } from "@/lib/imagekitUrl"

const AVATAR = "https://ik.imagekit.io/zan/avatars/priya_x1.jpg"
const DEV_BASE = "http://10.0.2.2:3000"

describe("getImagekitUrl", () => {
    test("asks ImageKit for twice the rendered size, in the best format", () => {
        expect(getImagekitUrl(AVATAR, 40)).toBe(`${AVATAR}?tr=w-80,h-80,f-auto`)
        expect(getImagekitUrl(AVATAR, 36.5)).toBe(`${AVATAR}?tr=w-73,h-73,f-auto`)
    })

    test("adds to an existing query string", () => {
        expect(getImagekitUrl(`${AVATAR}?updatedAt=1700000000`, 24)).toBe(
            `${AVATAR}?updatedAt=1700000000&tr=w-48,h-48,f-auto`,
        )
    })

    test("leaves a URL that already carries a transformation alone", () => {
        expect(getImagekitUrl(`${AVATAR}?tr=w-200`, 40)).toBe(`${AVATAR}?tr=w-200`)
        expect(getImagekitUrl("https://ik.imagekit.io/zan/tr:w-200/avatars/a.jpg", 40)).toBe(
            "https://ik.imagekit.io/zan/tr:w-200/avatars/a.jpg",
        )
    })

    test("puts the API base in front of a relative legacy URL, without an ImageKit transformation", () => {
        expect(getImagekitUrl("/uploads/avatars/legacy.jpg", 40, DEV_BASE)).toBe(
            "http://10.0.2.2:3000/uploads/avatars/legacy.jpg",
        )
        expect(getImagekitUrl("uploads/a.jpg", 40, `${DEV_BASE}/`)).toBe("http://10.0.2.2:3000/uploads/a.jpg")
    })

    test("a relative URL without a base cannot load", () => {
        expect(getImagekitUrl("/uploads/avatars/legacy.jpg", 40)).toBeNull()
    })

    test("nothing to load for an empty value", () => {
        expect(getImagekitUrl("", 40)).toBeNull()
        expect(getImagekitUrl("   ", 40)).toBeNull()
        expect(getImagekitUrl(null, 40)).toBeNull()
        expect(getImagekitUrl(undefined, 40)).toBeNull()
    })

    test("other hosts and local images are returned as they are", () => {
        for (const uri of [
            "https://example.com/a.jpg",
            "file:///data/user/0/com.zanverse/cache/pick.jpg",
            "content://media/external/images/media/42",
            "data:image/png;base64,iVBORw0KGgo=",
        ]) {
            expect(getImagekitUrl(uri, 40, DEV_BASE)).toBe(uri)
        }
    })
})
