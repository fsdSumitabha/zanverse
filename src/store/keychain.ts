import * as Keychain from "react-native-keychain"

/**
 * The JWT, and nothing else, in the platform keystore. It is read once at boot into memory, so `client.ts` can add
 * the header to every request without waiting on the keystore.
 */

const SERVICE = "com.zanverse.auth"
// Keychain stores a username/password pair. Only the password half carries anything.
const ACCOUNT = "jwt"

let cachedToken: string | null = null

/** Reads the stored token into memory. Call once at boot, before the first request. */
export async function loadToken(): Promise<string | null> {
    try {
        const credentials = await Keychain.getGenericPassword({ service: SERVICE })
        cachedToken = credentials ? credentials.password : null
    } catch {
        // A keystore that cannot be read (a reset device key, a restored backup) is the same as no token.
        cachedToken = null
    }
    return cachedToken
}

/** The token in memory. `null` before `loadToken` and after `clearToken`. */
export function getToken(): string | null {
    return cachedToken
}

/** Stores a new token after login. Memory is updated first, so the next request already carries it. */
export async function saveToken(token: string): Promise<void> {
    cachedToken = token
    await Keychain.setGenericPassword(ACCOUNT, token, {
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    })
}

/** Removes the token, on logout and on any 401. */
export async function clearToken(): Promise<void> {
    cachedToken = null
    try {
        await Keychain.resetGenericPassword({ service: SERVICE })
    } catch {
        // Nothing to remove, or the keystore is unreadable. Memory is already clear, which is what requests use.
    }
}
