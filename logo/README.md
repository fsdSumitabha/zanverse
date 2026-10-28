# ZAN brand kit and app icons

This folder holds the ZAN Services logo and every icon file made from it. The files that a build uses are copied into
`android/` and `ios/`. Everything else (Google Play, Windows, the web app) lives here.

## The mark

`zan_logo_square.png` is the original logo (the same file as the web app's `public/icon-512.png`). It is a 512 px raster
with a painted texture, so it blurs at the sizes an app icon needs (1024 px on iOS, 432 px on Android).

`tools/rebuild_mark.py` redraws it as clean vectors. It measures every straight edge and every rounded corner of the
raster, then rebuilds the shapes from those measurements:

- four regions (top, right, bottom, left) cut by the X-shaped gap;
- five thin cracks of one width, including the curl at the top right and the U-turn at the bottom right;
- the red triangle with its orange tip, and the three light-blue highlights in the centre.

The rebuilt mark covers 98.9% of the original's area, and each shard is within 2% of its original size. The edges
are straight, the corners are evenly rounded, and the colours are flat. That follows the Material 3 Expressive shape
language: rounded polygons with soft, consistent corners.

The mark comes in three cuts, because thin detail turns to blur at small sizes:

| Cut | File | Used at |
|---|---|---|
| Full | `svg/zan-mark.svg` | 56 px and up |
| Glyph | `svg/zan-mark-glyph.svg` | about 30 to 56 px, and the notification icon. Cracks 2.3 times wider, no highlights. |
| Tiny | `svg/zan-mark-tiny.svg` | under 30 px (favicons, small Windows icons). Only the X-shaped gap. |

Other source files: `svg/zan-mark-dark.svg` (for dark backgrounds), `svg/zan-mark-mono.svg` (one colour),
`svg/zan-app-icon.svg` (the square app icon with its background).

## Colours

| Role | Light | Dark backgrounds | Where it comes from |
|---|---|---|---|
| Shards | `#1D3158` | `#C8D6E5` | Measured from the logo. Dark: the web's dark-mode logo (`zan-logo-white.png`). |
| Highlights | `#3D5383` | `#EDF2F8` | Measured from the logo. |
| Triangle | `#BE3E3F` | `#BE3E3F` | Measured from the logo. |
| Tip | `#CB833B` | `#CB833B` | Measured from the logo. |
| Icon background | `#F1F3FF` | — | Material 3 (2025 colour spec) tone 96 of the brand navy `#183668`. |
| Splash background | `#FAFAFA` | `#0A0A0A` | `neutral-50` / `neutral-950`, the background of `SplashView`. |
| Notification accent | `#183668` | — | The web's brand navy (`src/theme.ts`, `BRAND_COLOR.dark`). |

## Android

| Place | File | Rule |
|---|---|---|
| Launcher icon, Android 8+ | `res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` | Adaptive icon: background, foreground, monochrome. |
| Foreground | `res/drawable/ic_launcher_foreground.xml` | Vector, 108 dp canvas. The mark is 46 dp, so its square corners stay inside the 66 dp safe zone that no launcher shape clips (circle, squircle, the Pixel's M3 shapes). |
| Background | `@color/ic_launcher_background` in `res/values/colors.xml` | A flat colour. |
| Themed icon, Android 13+ | `res/drawable/ic_launcher_monochrome.xml` | The mark's silhouette. The system uses only its alpha and tints it with the wallpaper colours (Material You). Android 16 QPR2 themes icons that lack one, so having our own keeps it looking right. |
| Launcher icon, Android 7 | `res/mipmap-{mdpi…xxxhdpi}/ic_launcher.png` and `ic_launcher_round.png` | 48 dp bitmaps: 48, 72, 96, 144, 192 px. |
| Splash, Android 12+ | `res/drawable/splash_icon.xml`, `res/drawable-night/splash_icon.xml`, `res/values-v31/styles.xml` | 288 dp canvas, mark 128 dp inside the 192 dp circle. Light and dark versions. |
| Window background | `res/values/styles.xml`, `res/values(-night)/colors.xml` | The splash colour, so the screen does not flash white (or grey in dark mode) before React draws. |
| Notification icon | `res/drawable/ic_notification.xml` | 24 dp, white, alpha only. Used by notify-kit (`src/lib/push/channels.ts`) and by Firebase (`AndroidManifest.xml`). Without it Android shows a white blob. |
| Notification accent | `@color/notification_accent`, and `NOTIFICATION_APPEARANCE` in `src/lib/push/channels.ts` | The brand navy. |
| Google Play listing | `play-store/icon-512.png`, `play-store/feature-graphic-1024x500.png` | Icon: 512 px, 32-bit PNG, full square (Play rounds the corners). Feature graphic: 1024 x 500, no alpha. |

Not needed: a TV banner (the app has no TV launcher entry) and shortcut icons (the app declares no shortcuts).

## In the app

`src/components/ui/ZanMark.tsx` draws the mark with `react-native-svg`. `SplashView` shows it at 128 dp in the centre,
the same size and place as the native splash before it, so the hand-over does not jump.

## iOS

| Place | File | Rule |
|---|---|---|
| App icon | `ios/zanverse/Images.xcassets/AppIcon.appiconset/` | One 1024 px image per look; Xcode makes every smaller size, for iPhone and iPad. |
| Default look | `AppIcon-1024.png` | Opaque, no alpha channel: the App Store rejects transparency. |
| Dark look (iOS 18+) | `AppIcon-1024-dark.png` | Transparent background, so the system's dark background shows through (Apple's rule). |
| Tinted look (iOS 18+) | `AppIcon-1024-tinted.png` | Grayscale (Apple's rule). The system tints it. |
| Launch screen | `ios/zanverse/LaunchScreen.storyboard`, `LaunchLogo.imageset`, `LaunchBackground.colorset` | The mark at 128 pt in the centre, light and dark, as `SplashView`. |
| Liquid Glass (iOS 26+), optional | `ios/icon-composer/*.svg` | See below. |

The asset-catalog icon works on every iOS version. iOS 26 adds its glass effect to it automatically. To control that
effect, build an Icon Composer file on a Mac: open Icon Composer (Xcode > Open Developer Tool), drag in the four SVGs
from `ios/icon-composer/` (they are already in back-to-front order), set the background to `#F1F3FF`, save it as
`AppIcon.icon`, and add it to the Xcode project. In the dark appearance, set the shards to `#C8D6E5` and the
highlights to `#EDF2F8`. Apple: once that file is in the project, it replaces the asset-catalog icon.

## Windows

`docs/WINDOWS.md` records the decision: on Windows, staff use the web app. So:

- `web/` is the Windows icon set in practice. Copy it into the web app (below).
- `windows/zan.ico` (16 to 256 px) is for a Tauri or Electron wrapper, or a desktop shortcut.
- `windows/msix/` is the full set for an MSIX package or a PWABuilder Store package: `Square44x44Logo` at five
  scales and fourteen target sizes, with the plated, dark-theme (`altform-unplated`) and light-theme
  (`altform-lightunplated`) versions; `Square71x71Logo`, `Square150x150Logo`, `Wide310x150Logo`, `Square310x310Logo`,
  `StoreLogo` and `SplashScreen` at five scales. Set the manifest's `BackgroundColor` to `#F1F3FF`.

## The web app

These go into the web repo (`zan-workspace`), which this repo does not change:

- `public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `icon-monochrome-512.png`
- `src/app/`: `favicon.ico`, `icon.svg` (switches to the dark colours in dark mode), and `apple-touch-icon.png` renamed
  to `apple-icon.png`
- `src/app/manifest.ts`: replace `icons` with the list in `web/manifest-icons.json`.

## Rebuild the files

Run from the repo root:

```
npm install --no-save @resvg/resvg-js@2.6.2 pngjs@7.0.0
node logo/tools/build-icons.mjs
```

It rewrites every file listed above from `tools/zan-mark.json`, and does not touch `package.json`. To change a colour
or a size, edit the constants at the top of `tools/build-icons.mjs`. To change the shapes, edit
`tools/rebuild_mark.py` and run it first (`python logo/tools/rebuild_mark.py`, needs `numpy` and `shapely`).
