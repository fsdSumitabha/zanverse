module.exports = {
    presets: ["module:@react-native/babel-preset", "nativewind/babel"],
    plugins: [
        [
            "module-resolver",
            {
                // "@/x" resolves to "./src/x". The key only matches "@" followed by "/", so scoped packages
                // such as "@react-navigation/native" are left alone.
                alias: { "@": "./src" },
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
            },
        ],
    ],
}
