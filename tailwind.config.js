/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: "media",
    theme: {
        extend: {},
    },
    plugins: [],
}
