module.exports = {
    preset: "@react-native/jest-preset",
    setupFiles: ["<rootDir>/jest/setup.js"],
    transform: {
        // lucide-react-native resolves to an .mjs entry, which the preset does not transform.
        "^.+\\.mjs$": "babel-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "\\.css$": "<rootDir>/jest/cssStub.js",
    },
    // react-native and react-native-*, plus the other packages that ship untranspiled ESM or JSX.
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native(-[^/]+)?|@react-native(-community)?|@react-native-documents|@react-native-picker|@react-navigation|lucide-react-native|nativewind)/)",
    ],
    // The read-only web app clone has its own package.json and must not join the module map.
    modulePathIgnorePatterns: ["<rootDir>/reference/"],
}
