import * as Keychain from "react-native-keychain"

import { getToken, loadToken, saveToken } from "@/store/keychain"
import { wasInstallSeen } from "@/store/mmkv"

// A fresh test file starts with empty MMKV, as a fresh install does.
describe("a token left by an earlier install", () => {
    it("is cleared once on the first boot, and a token this install saved is kept", async () => {
        await Keychain.setGenericPassword("jwt", "old-install-token", { service: "com.zanverse.auth" })
        expect(wasInstallSeen()).toBe(false)

        expect(await loadToken()).toBeNull()
        expect(await Keychain.getGenericPassword({ service: "com.zanverse.auth" })).toBe(false)
        expect(wasInstallSeen()).toBe(true)

        await saveToken("new-token")
        expect(await loadToken()).toBe("new-token")
        expect(getToken()).toBe("new-token")
    })
})
