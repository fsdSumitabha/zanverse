/// <reference types="nativewind/types" />

// TypeScript 6 checks side-effect imports by default. This lets App.tsx `import "./global.css"`.
declare module "*.css"
